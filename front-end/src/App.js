import React, { useEffect, useState } from "react";
import { ethers, providers } from "ethers";
import { Image } from "antd";

import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import epicNftContract from "./utils/EpicNftContract.json";
import { useMoralis } from "react-moralis";

const TWITTER_HANDLE = "CristiansenL";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const IPFS = require("ipfs");
const OrbitDB = require("orbit-db");

// I moved the contract address to the top for easy access.
const CONTRACT_ADDRESS = "0xf79064159d6f50C9cB7A1599eA4eeAB2dB0cFca6";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  // let NFTbalance = [];
  const [NFTbalance, setNFTbalance] = useState([]);
  const { Moralis, isInitialized } = useMoralis();
  const [message, setMessage] = useState("");
  // const [ipfsOptions, setIpfsOptions] = useState();
  const [orbitdb, setOrbitdb] = useState();
  const [db, setDb] = useState();
  const [fetchComments, setFetchComments] = useState(true);
  const [holders, setHolders] = useState([]);

  const getNFTs = async (options) => {
    const nfts = await Moralis.Web3API.token.getNFTOwners(options);
    setNFTbalance(nfts.result);
  };

  async function initDB() {
    const ipfsOptions = { repo: "./ipfs" + Math.random() };
    const ipfs = await IPFS.create(ipfsOptions);
    setOrbitdb(await OrbitDB.createInstance(ipfs));
  }

  const postComment = async (nftName) => {
    for (let index in holders) {
      if (holders[index].toLowerCase() !== currentAccount) {
        alert(
          "You are NOT A HOLDER. Mint your NFT first OR change account THEN refresh the page."
        );
        return false;
      }
    }

    if (message.length < 4) {
      alert("Message is too short");
      return false;
    }

    console.log("Posting comment...");
    setFetchComments(true);

    // const db = await orbitdb.keyvalue("first-database");

    console.log("Message: ", message);
    await db.put(
      nftName,
      { address: currentAccount, postComment: message },
      { pin: true }
    );
    const value = db.get(nftName);
    console.log("post value:", value);

    areThereComments(nftName);

    await db.close();
  };

  const areThereComments = async (nftName) => {
    console.log("Getting comments...");

    const comments = db.get(nftName);

    if (comments) {
      setFetchComments(false);
      console.log("getComments found comments: ", comments);
      return true;
    }
    console.log("NO comments found");
    return false;
  };

  const showComments = (nftName) => {
    const comments = db.get(nftName);
    return (
      <div
        style={{
          background: "lightgrey",
          width: "max-content",
          display: "inline-block",
          textAlign: "initial",
          borderRadius: "15px",
          padding: "10px",
          margin: "10px",
        }}
      >
        {comments ? (
          <div>
            <div style={{ paddingBottom: "5px" }}>Comment Section</div>
            <div>From: {comments?.address}</div>
            <div>{comments?.postComment}</div>
          </div>
        ) : (
          <div>No comments yet</div>
        )}
      </div>
    );
  };

  useEffect(() => {
    async function main() {
      const db = await orbitdb?.keyvalue("first-database");
      setDb(db);
    }
    main();
  }, [orbitdb]);

  useEffect(() => {
    checkIfWalletIsConnected();
    initDB();
  }, []);

  useEffect(() => {
    async function runGetNFTs() {
      if (isInitialized) {
        const options = { address: CONTRACT_ADDRESS, chain: "mumbai" };
        await getNFTs(options);
      }
    }
    runGetNFTs();
  }, [isInitialized]);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    let chainId = await ethereum.request({ method: "eth_chainId" });

    const rinkebyChainId = "0x13881";
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Mumbai Test Network!");
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      // This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  // Setup our listener.
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          epicNftContract.abi,
          signer
        );

        const allHolders = await connectedContract.getAllHolders();
        setHolders(allHolders);

        // This will  "capture" the event when the contract throws it.
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `We've minted your NFT and sent it to your wallet. It can take 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        // console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          epicNftContract.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.");
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://mumbai.polygonscan.com/tx/${nftTxn.hash}`
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
    <button
      onClick={askContractToMintNft}
      className="cta-button connect-wallet-button"
    >
      Mint NFT
    </button>
  );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="header gradient-text" style={{ fontSize: "40px" }}>
            -DoinGud challenge-
          </p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>

          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}
          <p className="sub-text" style={{ marginTop: "100px" }}>
            Minted until now
          </p>

          {NFTbalance &&
            NFTbalance.map((nft, index) => {
              const nftMetadata = JSON.parse(nft.metadata);
              return (
                <div
                  key={index}
                  style={{
                    // background: "white",
                    background:
                      "-webkit-linear-gradient(left, #ea81d0 30%, #ff8429 60%)",
                    width: "650px",
                    display: "inline-block",
                    borderRadius: "15px",
                    margin: "10px",
                    padding: "10px",
                  }}
                >
                  <div
                    style={{
                      background: "white",
                      width: "500px",
                      display: "inline-flex",
                      borderRadius: "15px",
                      margin: "10px",
                      padding: "10px",
                      flexDirection: "row",
                    }}
                  >
                    <Image
                      preview={false}
                      src={nftMetadata?.image}
                      alt=""
                      style={{ height: "300px", width: "300px" }}
                    />
                    <div
                      style={{ overflowWrap: "anywhere", margin: "0px 5px" }}
                    >
                      <div
                        style={{
                          fontSize: "15px",
                          textAlign: "start",
                          marginBottom: "5px",
                        }}
                      >
                        Name: {nftMetadata?.name}
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          textAlign: "start",
                          marginBottom: "5px",
                        }}
                      >
                        Collection: {nftMetadata?.description}
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          textAlign: "start",
                          marginBottom: "5px",
                        }}
                      >
                        Owner: {nft?.owner_of}
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          textAlign: "start",
                          marginBottom: "5px",
                        }}
                      >
                        Contract Address: {nft?.token_address}
                      </div>
                    </div>
                  </div>
                  <div>
                    {db &&
                      console.log(
                        "CHECK: ",
                        fetchComments && !!areThereComments(nftMetadata.name)
                      )}
                    {db ? (
                      fetchComments && !!areThereComments(nftMetadata.name) ? (
                        <div>Be the first to comment</div>
                      ) : (
                        showComments(nftMetadata.name)
                      )
                    ) : (
                      <div>Loading</div>
                    )}
                  </div>
                  <div style={{ display: "inline-grid" }}>
                    <input
                      type="text"
                      name="name"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="HOLDER? Then comment here..."
                      style={{
                        margin: "10px 0px",
                        borderRadius: "10px",
                        height: "30px",
                      }}
                    />
                    <button
                      onClick={() => postComment(nftMetadata.name)}
                      className="cta-button connect-wallet-button"
                    >
                      Post your comment
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
