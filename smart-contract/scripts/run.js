// This is used for testing

const main = async () => {
  const [owner] = await ethers.getSigners();

  const nftContractFactory = await hre.ethers.getContractFactory(
    "EpicNFTContract"
  );
  const nftContract = await nftContractFactory.deploy();
  await nftContract.deployed();
  console.log("Contract deployed to:", nftContract.address);

  let txn = await nftContract.makeAnEpicNFT();
  await txn.wait();

  txn = await nftContract.makeAnEpicNFT();
  await txn.wait();

  console.log("all holders:", await nftContract.getAllHolders());
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
