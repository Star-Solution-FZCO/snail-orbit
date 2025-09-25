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
}> = (props) => {
    const { customField } = props;

    const isEnumType = ["enum", "enum_multi"].includes(customField.type);
    const isUserType = ["user", "user_multi"].includes(customField.type);
    const isVersionType = ["version", "version_multi"].includes(
        customField.type,
    );
    const isStateType = customField.type === "state";
    const isOwnedType = ["owned", "owned_multi"].includes(customField.type);

    if (isEnumType) {
        return <CustomFieldEnumOptionsEditor {...props} />;
    }

    if (isUserType) {
        return <CustomFieldUserOptionsEditor {...props} />;
    }

    if (isVersionType) {
        return <CustomFieldVersionOptionsEditor {...props} />;
    }

    if (isStateType) {
        return <CustomFieldStateOptionsEditor {...props} />;
    }

    if (isOwnedType) {
        return <CustomFieldOwnedOptionsEditor {...props} />;
    }

    return null;
};
