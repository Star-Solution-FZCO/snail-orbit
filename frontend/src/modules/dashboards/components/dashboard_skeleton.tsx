import { Skeleton, Stack } from "@mui/material";

export const DashboardSkeleton = () => {
    return (
        <Stack px={4} pb={4} height={1} gap={1}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
                borderBottom={1}
                borderColor="divider"
                pb={1}
            >
                <Stack direction="row" alignItems="center" gap={1}>
                    <Skeleton variant="rounded" width={200} height={32} />
                    <Skeleton variant="circular" width={24} height={24} />
                </Stack>

                <Stack direction="row" alignItems="center" gap={1}>
                    {[165, 106].map((width, index) => (
                        <Skeleton
                            key={index}
                            variant="rounded"
                            width={width}
                            height={32}
                        />
                    ))}
                </Stack>
            </Stack>

            <Stack flexWrap="wrap" gap={2} flex={1}>
                {Array.from({ length: 2 }).map((_, rowIndex) => (
                    <Stack key={rowIndex} direction="row" gap={2} flex={1}>
                        {Array.from({ length: 2 }).map((_, colIndex) => (
                            <Skeleton
                                key={colIndex}
                                variant="rounded"
                                sx={{
                                    flex: 1,
                                    height: 1,
                                }}
                            />
                        ))}
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
};
