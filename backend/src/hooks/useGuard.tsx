import { useContext } from "react";
import { GuardContext } from "../providers/GuardProvider";

export const useGuard = () => useContext(GuardContext)