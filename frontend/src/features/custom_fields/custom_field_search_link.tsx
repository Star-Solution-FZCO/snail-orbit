import type { CustomFieldWithValueT } from "shared/model/types";
import { fieldToFieldValue } from "shared/model/mappers/issue";
import type { PropsWithChildren } from "react";
import { Link } from "shared/ui";

type CustomFieldSearchLinkProps = {
    field: CustomFieldWithValueT;
} & PropsWithChildren

export const CustomFieldSearchLink = (props: CustomFieldSearchLinkProps) => {
    const { field, children } = props;

    return <Link
        to="/issues"
        search={{ query: `${field.name}: ${fieldToFieldValue(field)}` }}
        onClick={(e) => e.preventDefault()}
    >{children}</Link>
}