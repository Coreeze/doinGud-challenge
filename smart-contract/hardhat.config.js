require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

const { POLYGON_API_URL, POLYGON_PRIVATE_ACCOUNT_KEY } = process.env;

module.exports = {
  solidity: "0.8.1",
  networks: {
    mumbai: {
      url: POLYGON_API_URL,
      accounts: [POLYGON_PRIVATE_ACCOUNT_KEY],
    },
  },
};
