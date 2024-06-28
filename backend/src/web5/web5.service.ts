import { Web5 } from "@web5/api";

export let web5: Web5;
export let did: string;

export const checkHasProtocol = async () => {
  ({ web5, did } = await Web5.connect());
  return { web5, did }
};