import React, { useState, useCallback } from "react";
import { Button, useToast } from "@chakra-ui/react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
import { PublicKey, Transaction } from "@solana/web3.js";

// Duplicated constants to avoid import error; keep in sync with Leaderboard.tsx
const ADMIN_PUBKEY = "5yDAFUqw6pGTjSctiUkx4kF71goGUnAGcQF2EWBVQdfU";
const TOKEN_MINT = new PublicKey("Cy8tMvKfMeGhYxnMKd85D2axDawfeMFoCyauEE3zXZRs");

const CreateAdminATAButton: React.FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreateATA = useCallback(async () => {
    setLoading(true);
    try {
      if (!publicKey || !signTransaction) {
        toast({ title: "Wallet not connected", status: "error", duration: 3000, isClosable: true });
        return;
      }
      if (!publicKey.equals(new PublicKey(ADMIN_PUBKEY))) {
        toast({ title: "Only admin can create this ATA", status: "error", duration: 3000, isClosable: true });
        return;
      }
      const ata = getAssociatedTokenAddressSync(
        TOKEN_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const ataInfo = await connection.getAccountInfo(ata);
      if (ataInfo) {
        toast({ title: "ATA already exists", status: "info", duration: 3000, isClosable: true });
        setLoading(false);
        return;
      }
      // Do NOT pass a custom programId here. SPL Token library will use the correct mainnet program IDs.
      const ix = createAssociatedTokenAccountInstruction(
        publicKey, // payer
        ata,       // ata
        publicKey, // owner
        TOKEN_MINT,
        TOKEN_2022_PROGRAM_ID
      );
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction().add(ix);
      tx.feePayer = publicKey;
      tx.recentBlockhash = blockhash;
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      toast({ title: "ATA created!", description: `Tx: ${sig}`, status: "success", duration: 5000, isClosable: true });
    } catch (e: any) {
      let description = e.message;
      // If error is a SendTransactionError, try to get logs
      if (e && typeof e.getLogs === "function") {
        try {
          const logs = await e.getLogs();
          description += "\n" + (logs ? logs.join("\n") : "No logs");
        } catch {}
      }
      toast({ title: "Failed to create ATA", description, status: "error", duration: 8000, isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, connection, toast]);

  return (
    <Button
      mt={2}
      colorScheme="blue"
      isLoading={loading}
      onClick={handleCreateATA}
      size="sm"
      variant="outline"
    >
      Create My Token Account (ATA)
    </Button>
  );
};

export default CreateAdminATAButton;
