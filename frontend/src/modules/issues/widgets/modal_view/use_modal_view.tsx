import { useContext } from "react";
import { IssueModalViewContext } from "./modal_view_context";

export const useIssueModalView = () => useContext(IssueModalViewContext);
