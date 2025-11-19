const DEFAULT_BTCUNI_CONTRACT_ADDRESS =
  "STE8EXW8APGP8Y9WT9K102KCGEKZY4KH0VKSXD9Y";
const DEFAULT_BTCUNI_CONTRACT_NAME = "btc-university";
const DEFAULT_SBTC_CONTRACT_ADDRESS =
  "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT";
const DEFAULT_SBTC_CONTRACT_NAME = "sbtc-token";

function envOrDefault(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value && value.trim().length > 0) {
    return value.trim();
  }
  if (fallback !== undefined) {
    return fallback;
  }
  return "";
}

const BTCUNI_ADDRESS = envOrDefault(
  "NEXT_PUBLIC_BTCUNI_CONTRACT_ADDRESS",
  DEFAULT_BTCUNI_CONTRACT_ADDRESS
);
const BTCUNI_NAME = envOrDefault(
  "NEXT_PUBLIC_BTCUNI_CONTRACT_NAME",
  DEFAULT_BTCUNI_CONTRACT_NAME
);
const SBTC_ADDRESS = envOrDefault(
  "NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS",
  DEFAULT_SBTC_CONTRACT_ADDRESS
);
const SBTC_NAME = envOrDefault(
  "NEXT_PUBLIC_SBTC_CONTRACT_NAME",
  DEFAULT_SBTC_CONTRACT_NAME
);

export const CONTRACTS = {
  BTCUNI_MAIN: `${BTCUNI_ADDRESS}.${BTCUNI_NAME}`,
  BTCUNI_NFT: `${envOrDefault(
    "NEXT_PUBLIC_BTCUNI_NFT_CONTRACT_ADDRESS",
    BTCUNI_ADDRESS
  )}.${envOrDefault("NEXT_PUBLIC_BTCUNI_NFT_CONTRACT_NAME", "btc-university-nft")}`,
  SBTC_TOKEN: `${SBTC_ADDRESS}.${SBTC_NAME}`,
  DIA_ORACLE: `${envOrDefault(
    "NEXT_PUBLIC_DIA_ORACLE_CONTRACT_ADDRESS"
  )}.${envOrDefault("NEXT_PUBLIC_DIA_ORACLE_CONTRACT_NAME")}`,
};

export const CONTRACT_OWNER_ADDRESS =
  envOrDefault("NEXT_PUBLIC_BTCUNI_OWNER_ADDRESS") || BTCUNI_ADDRESS;

export function parseContractId(contractId: string): {
  address: string;
  name: string;
} {
  const [address, name] = contractId.split(".");
  if (!address || !name) {
    throw new Error(`Invalid contract identifier: ${contractId}`);
  }
  return { address, name };
}

export const DEFAULT_CONTRACT_IDS = {
  BTCUNI_MAIN: `${DEFAULT_BTCUNI_CONTRACT_ADDRESS}.${DEFAULT_BTCUNI_CONTRACT_NAME}`,
  SBTC_TOKEN: `${DEFAULT_SBTC_CONTRACT_ADDRESS}.${DEFAULT_SBTC_CONTRACT_NAME}`,
};
