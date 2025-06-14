import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ClickGame } from "../target/types/click_game";

describe("click-game", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.ClickGame as Program<ClickGame>;
  const payer = provider.wallet as anchor.Wallet;
  const gameDataSeed = "gameData";

  it("Init player and chop tree!", async () => {
    console.log("Local address", payer.publicKey.toBase58());

    const balance = await anchor
      .getProvider()
      .connection.getBalance(payer.publicKey);

    if (balance < 1e8) {
      const res = await anchor
        .getProvider()
        .connection.requestAirdrop(payer.publicKey, 1e9);
      await anchor
        .getProvider()
        .connection.confirmTransaction(res, "confirmed");
    }

    const [playerPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), payer.publicKey.toBuffer()],
      program.programId
    );

    console.log("Player PDA", playerPDA.toBase58());

    const [gameDataPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(gameDataSeed)],
      program.programId
    );

    try {
      let tx = await program.methods
        .initPlayer(gameDataSeed)
        .accountsStrict({
          player: playerPDA,
          signer: payer.publicKey,
          gameData: gameDataPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({ skipPreflight: true });
      console.log("Init transaction", tx);

      await anchor.getProvider().connection.confirmTransaction(tx, "confirmed");
      console.log("Confirmed", tx);
    } catch (e) {
      console.log("Player already exists: ", e);
    }

    for (let i = 0; i < 11; i++) {
      console.log(`Chop instruction ${i}`);

      let tx = await program.methods
        .chopTree(gameDataSeed, 0)
        .accountsStrict({
          player: playerPDA,
          sessionToken: null,
          signer: payer.publicKey,
          gameData: gameDataPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log("Chop instruction", tx);
      await anchor.getProvider().connection.confirmTransaction(tx, "confirmed");
    }

    const accountInfo = await anchor
      .getProvider()
      .connection.getAccountInfo(playerPDA, "confirmed");

    const decoded = program.coder.accounts.decode(
      "playerData",
      accountInfo.data
    );
    console.log("Player account info", JSON.stringify(decoded));
  });
});
