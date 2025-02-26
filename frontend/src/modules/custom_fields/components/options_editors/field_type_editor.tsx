import { FC } from "react";
import { CustomFieldT } from "types";
import { CustomFieldEnumOptionsEditor } from "./enum_options_editor";
import { CustomFieldStateOptionsEditor } from "./state_options_editor";
import { CustomFieldUserOptionsEditor } from "./user_options_editor";
import { CustomFieldVersionOptionsEditor } from "./version_options_editor";

export const FieldTypeEditor: FC<{ customField: CustomFieldT }> = ({
    customField,
}) => {
    const isEnumType = ["enum", "enum_multi"].includes(customField.type);
    const isUserType = ["user", "user_multi"].includes(customField.type);
    const isVersionType = ["version", "version_multi"].includes(
        customField.type,
    );
    const isStateType = customField.type === "state";

    if (isEnumType) {
        return <CustomFieldEnumOptionsEditor customField={customField} />;
    }

    if (isUserType) {
        return <CustomFieldUserOptionsEditor customField={customField} />;
    }

    if (isVersionType) {
        return <CustomFieldVersionOptionsEditor customField={customField} />;
    }

    if (isStateType) {
        return <CustomFieldStateOptionsEditor customField={customField} />;
    }

    return null;
};
