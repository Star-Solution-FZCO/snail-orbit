import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Stack,
} from "@mui/material";
import { $createTextNode, TextNode } from "lexical";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import { userApi } from "shared/model/api/user.api";
import type { BasicUserT } from "shared/model/types";
import { UserAvatar } from "shared/ui/user_avatar";
import useDebouncedState from "shared/utils/hooks/use-debounced-state";
import { $createMentionNode } from "../nodes/mention_node";

class MentionOption extends MenuOption {
    user: BasicUserT;

    constructor(user: BasicUserT) {
        super(user.name);
        this.user = user;
    }
}

function MentionsTypeaheadMenuItem({
    isSelected,
    onClick,
    onMouseEnter,
    option,
}: {
    index: number;
    isSelected: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    option: MentionOption;
}) {
    return (
        <ListItem
            key={option.key}
            sx={{
                cursor: "pointer",
                backgroundColor: isSelected ? "action.selected" : "transparent",
                "&:hover": {
                    backgroundColor: "action.hover",
                },
            }}
            tabIndex={-1}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
        >
            <ListItemAvatar>
                <UserAvatar src={option.user.avatar} size={32} />
            </ListItemAvatar>

            <ListItemText
                primary={option.user.name}
                secondary={option.user.email}
                slotProps={{
                    primary: {
                        variant: "body2",
                    },
                    secondary: { variant: "caption" },
                }}
            />
        </ListItem>
    );
}

export const MentionsPlugin: FC = () => {
    const [editor] = useLexicalComposerContext();
    
    const [debouncedQuery, setQueryString] = useDebouncedState<string | null>(
        null,
        300,
    );

    const [trigger] = userApi.useLazyListSelectUserQuery();

    const [users, setUsers] = useState<BasicUserT[]>([]);

    const checkForMentionMatch = useBasicTypeaheadTriggerMatch("@", {
        minLength: 0,
    });

    const options = useMemo(
        () => users.map((user) => new MentionOption(user)),
        [users],
    );

    const onSelectOption = useCallback(
        (
            selectedOption: MentionOption,
            nodeToReplace: TextNode | null,
            closeMenu: () => void,
        ) => {
            editor.update(() => {
                const mentionNode = $createMentionNode(
                    selectedOption.user.id,
                    selectedOption.user.name,
                );
                const spaceNode = $createTextNode(" ");

                if (nodeToReplace) {
                    nodeToReplace.replace(mentionNode);
                }

                mentionNode.insertAfter(spaceNode);
                spaceNode.select();
                closeMenu();
            });
        },
        [editor],
    );

    const checkForSlashTriggerMatch = useCallback(
        (text: string) => {
            const match = checkForMentionMatch(text, editor);
            if (match !== null) {
                setQueryString(match.matchingString);
            }
            return match;
        },
        [checkForMentionMatch, editor],
    );

    useEffect(() => {
        if (debouncedQuery !== null) {
            trigger({
                search: debouncedQuery,
                limit: 10,
                offset: 0,
            }).then((result) => {
                if (result.data) {
                    setUsers(result.data.payload.items);
                }
            });
        }
    }, [debouncedQuery, trigger]);

    return (
        <LexicalTypeaheadMenuPlugin<MentionOption>
            options={options}
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
            triggerFn={checkForSlashTriggerMatch}
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
            ) =>
                anchorElementRef.current && options.length
                    ? ReactDOM.createPortal(
                          <Paper
                              sx={{
                                  minWidth: 250,
                                  maxHeight: 300,
                                  overflow: "auto",
                              }}
                              elevation={3}
                          >
                              <Stack
                                  component="ul"
                                  sx={{ listStyle: "none", px: 0, py: 1, m: 0 }}
                              >
                                  {options.map((option, i: number) => (
                                      <MentionsTypeaheadMenuItem
                                          key={option.key}
                                          index={i}
                                          option={option}
                                          onClick={() => {
                                              setHighlightedIndex(i);
                                              selectOptionAndCleanUp(option);
                                          }}
                                          onMouseEnter={() => {
                                              setHighlightedIndex(i);
                                          }}
                                          isSelected={selectedIndex === i}
                                      />
                                  ))}
                              </Stack>
                          </Paper>,
                          anchorElementRef.current,
                      )
                    : null
            }
        />
    );
};
