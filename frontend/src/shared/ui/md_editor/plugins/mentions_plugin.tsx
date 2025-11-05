import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    MenuTextMatch,
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
        super(user.email);
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
                <UserAvatar
                    src={option.user.avatar}
                    size={32}
                    isBot={option.user.is_bot}
                />
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

    const [trigger, { reset }] = userApi.useLazyListSelectUserQuery();

    const [users, setUsers] = useState<BasicUserT[]>([]);

    const checkForMentionMatch = useCallback(
        (text: string): MenuTextMatch | null => {
            const match = /(?:^|\s)@([^@\n]{0,50})$/.exec(text);
            if (match !== null) {
                const maybeLeadingWhitespace = match[0].startsWith(" ") ? 1 : 0;
                return {
                    leadOffset: match.index + maybeLeadingWhitespace,
                    matchingString: match[1],
                    replaceableString: match[0].trim(),
                };
            }
            return null;
        },
        [],
    );

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
                    selectedOption.user.email,
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
            const match = checkForMentionMatch(text);
            if (match !== null) {
                setQueryString(match.matchingString);
            }
            return match;
        },
        [checkForMentionMatch],
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
        } else {
            setUsers([]);
        }
    }, [debouncedQuery, trigger]);

    useEffect(() => {
        return () => {
            setUsers([]);
            reset();
        };
    }, [reset]);

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
                              sx={(theme) => ({
                                  minWidth: 300,
                                  maxHeight: 300,
                                  overflow: "auto",
                                  position: "absolute",
                                  zIndex: theme.zIndex.modal + 1,
                              })}
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
