import { LocalOfferOutlined } from "@mui/icons-material";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";

export const TagAdornment = (props: { color: string }) => {
    return (
        <ColorAdornment
            color={props.color}
            size="medium"
            sx={{ mr: 1, my: "auto" }}
        >
            <LocalOfferOutlined
                sx={{
                    width: "75%",
                    height: "75%",
                }}
            />
        </ColorAdornment>
    );
};
