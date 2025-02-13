const GAUTH_KEY = process.env.GOOGLE_API_KEY; // https://developers.google.com/sheets/api/guides/authorizing#APIKey
const { response } = require("express");
const request = require("request");
const sheets = Object.fromEntries(
  process.env.SHEETS_ALIASES.split(",").map((v) => v.split("|"))
);
const authorizedSheets = Object.values(sheets);

const err = (text) => JSON.stringify({ error: text });

module.exports = function (req, res, next) {
  try {
    const { alias, id, range, apiKey } = req.query;
    console.log(alias, id, range);

    if ((!id && !alias) || (id && alias))
      return res.status(400).json(err("You must provide ID or Alias"));

    if (!id && !sheets[alias])
      return res
        .status(404)
        .json(err(`No such alias ${alias}, ask maintainer to add it`));

    const sheetId = id ? id : sheets[alias];
    const resolvedApiKey = apiKey ? apiKey : GAUTH_KEY;

    try {
      const valueQuery = range ? `/values/${range}` : "";
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}${valueQuery}?key=${resolvedApiKey}`;
      request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          const data = JSON.parse(response.body);
          if (valueQuery) {
            if (data && data.values) {
              return res.status(200).json(data);
            } else {
              return res.status(response.statusCode).json(data.error);
            }
          } else {
            return res.status(200).json(data);
          }
        } else {
          return res.status(response.statusCode).json(data.error);
        }
      });
    } catch (e) {
      console.error(e);
      res.status(500).json(err("Some error making a request to Google"));
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json(err(e));
  }
};

// module.exports = function (req, res, next) {
//   try {
//     const params = req.query,
//       api_key = params.api_key || GAUTH_KEY,
//       alias = params.id,
//       sheet = params.sheet,
//       query = params.q,
//       useIntegers = params.integers || true,
//       showRows = params.rows || true,
//       showColumns = params.columns || true;

//     const idFromAlias = sheets[params.alias];
//     const id = params.id || idFromAlias;

//     if (params.alias && !idFromAlias) {
//       return res
//         .status(404)
//         .json("Sheet alias not found; you can request maintainer to add it");
//     }

//     if (!id) {
//       return res.status(400).json("Sheet ID not provided");
//     }

//     if (!sheet) {
//       return res.status(400).json("You must provide a sheet name");
//     }

//     const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${sheet}?key=${api_key}`;

//   request(url, function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//       var data = JSON.parse(response.body);
//       var responseObj = {};
//       var rows = [];
//       var columns = {};

//       if (data && data.values) {
//         var headings = data.values[0];

//         for (var i = 1; i < data.values.length; i++) {
//           var entry = data.values[i];
//           var newRow = {};
//           var queried = !query;
//           for (var j = 0; j < entry.length; j++) {
//             var name = headings[j];
//             var value = entry[j];
//             if (query) {
//               if (value.toLowerCase().indexOf(query.toLowerCase()) > -1) {
//                 queried = true;
//               }
//             }
//             if (Object.keys(params).indexOf(name) > -1) {
//               queried = false;
//               if (value.toLowerCase() === params[name].toLowerCase()) {
//                 queried = true;
//               }
//             }
//             if (useIntegers === true && !isNaN(value)) {
//               value = Number(value);
//             }
//             ``;
//             newRow[name] = value;
//             if (queried === true) {
//               if (!columns.hasOwnProperty(name)) {
//                 columns[name] = [];
//                 columns[name].push(value);
//               } else {
//                 columns[name].push(value);
//               }
//             }
//           }
//           if (queried === true) {
//             rows.push(newRow);
//           }
//         }
//         if (showColumns === true) {
//           responseObj["columns"] = columns;
//         }
//         if (showRows === true) {
//           responseObj["rows"] = rows;
//         }
//         return res.status(200).json(responseObj);
//       } else {
//         var data = JSON.parse(response.body);
//         return res.status(response.statusCode).json(data.error);
//       }
//     } else {
//       var data = JSON.parse(response.body);
//       return res.status(response.statusCode).json(data.error);
//     }
//   });
// } catch (error) {
//   var data = JSON.parse(response.body);
//   return res.status(response.statusCode).json(data.error);
// }
// };
