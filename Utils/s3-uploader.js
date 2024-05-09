const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: "AKIA47CRXSL7Q7ESTQG4",
  secretAccessKey: "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",
});

const uploadFile = async (file) => {
  const params = {
    Bucket: "wanna-come-bucket",
    Key: `wanna-come-app-${Date.now()}-${file.name}`,
    Body: file.data,
  };
  const data = await s3.upload(params).promise();
  return data.Location; // returns the url location
};

module.exports = {
  uploadFile,
};
