"use strict";
const QRCode = require("qrcode");
const JSZip = require("jszip");
const csv = require("csv");
const multipart = require("aws-lambda-multipart-parser");

module.exports.qrMaker = async (event, context, callback) => {
  if (event.isBase64Encoded) {
    const body = Buffer.from(event.body, "base64").toString("ascii");
    if (
      body.indexOf(`Content-Disposition: form-data; name="img"`) !== -1 &&
      body.indexOf("text/csv") !== -1
    ) {
      const extension = body
        .split(`Content-Disposition: form-data; name="img"`)[1]
        .split("\r\n")[2];
      const zip = new JSZip();
      const csv = body
        .split(`Content-Disposition: form-data; name="img"`)[0]
        .split("\r\n")
        .slice(4, -2);
      for (const value of csv) {
        const fileName = value.split(",")[0];
        const fileValue = value.split(",")[1];
        const dataURL = await QRCode.toDataURL(fileValue, { margin: 2 });
        zip.file(
          `${fileName}.png`,
          dataURL.replace(/^data:image\/(png|jpg);base64,/, ""),
          { base64: true }
        );
      }

      const zipBase64 = await zip.generateAsync({ type: "base64" });
      const response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: zipBase64
      };
      callback(null, response);
    } else {
      const response = {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*" // Required for CORS support to work
        },
        body: "잘못된 형식"
      };
      callback(null, response);
    }
  }
};
