import { Cl } from "@stacks/transactions";
import { CONTRACTS, parseContractId } from "./contracts";

export function getContractPrincipalCV(contractId: string) {
  const { address, name } = parseContractId(contractId);
  return Cl.contractPrincipal(address, name);
}

export function getSbtcContractPrincipalCV() {
  return getContractPrincipalCV(CONTRACTS.SBTC_TOKEN);
}
