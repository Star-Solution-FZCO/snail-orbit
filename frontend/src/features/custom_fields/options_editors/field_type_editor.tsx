import { FC } from "react";
import { CustomFieldT } from "shared/model/types";
import { CustomFieldEnumOptionsEditor } from "./enum_options_editor";
import { CustomFieldOwnedOptionsEditor } from "./owned_options_editor";
import { CustomFieldStateOptionsEditor } from "./state_options_editor";
import { CustomFieldUserOptionsEditor } from "./user_options_editor";
import { CustomFieldVersionOptionsEditor } from "./version_options_editor";

export const FieldTypeEditor: FC<{
    customField: CustomFieldT;
    readOnly?: boolean;
}> = ({ customField, readOnly = false }) => {
    const isEnumType = ["enum", "enum_multi"].includes(customField.type);
    const isUserType = ["user", "user_multi"].includes(customField.type);
    const isVersionType = ["version", "version_multi"].includes(
        customField.type,
    );
    const isStateType = customField.type === "state";
    const isOwnedType = ["owned", "owned_multi"].includes(customField.type);

    if (isEnumType) {
        return (
            <CustomFieldEnumOptionsEditor
                customField={customField}
                readOnly={readOnly}
            />
        );
    }

    if (isUserType) {
        return (
            <CustomFieldUserOptionsEditor
                customField={customField}
                readOnly={readOnly}
            />
        );
    }

    if (isVersionType) {
        return (
            <CustomFieldVersionOptionsEditor
                customField={customField}
                readOnly={readOnly}
            />
        );
    }

    if (isStateType) {
        return (
            <CustomFieldStateOptionsEditor
                customField={customField}
                readOnly={readOnly}
            />
        );
    }

    if (isOwnedType) {
        return (
            <CustomFieldOwnedOptionsEditor
                customField={customField}
                readOnly={readOnly}
            />
        );
    }

    return null;
};
