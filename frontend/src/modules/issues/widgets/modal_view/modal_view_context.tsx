import { createContext } from "react";
import type { IssueModalViewContextType } from "./modal_view.types";

const noFunc = () => {
    throw new Error("No provider");
};

export const IssueModalViewContext = createContext<IssueModalViewContextType>({
    createAndOpenIssueModal: noFunc,
    openIssueModal: noFunc,
});
