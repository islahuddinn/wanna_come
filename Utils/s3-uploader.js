const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: "", //
  secretAccessKey: "", //
});

const uploadFile = async (file) => {
  const params = {
    Bucket: "beidobucket", // bucket you want to upload to
    Key: `beido-app-${Date.now()}-${file.name}`, // put all image to fileupload folder with name scanskill-${Date.now()}${file.name}`
    Body: file.data,
  };
  const data = await s3.upload(params).promise();
  return data.Location; // returns the url location
};

module.exports = {
  uploadFile,
};
