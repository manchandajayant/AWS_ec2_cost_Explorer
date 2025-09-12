import { SkeletonLoaderProps } from "./types";

export const SkeletonLoader = ({ type }: SkeletonLoaderProps) => {
    if (type === "chart") {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-md p-4 animate-pulse">
                <div className="w-full space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        );
    }
    if (type === "table") {
        return Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
                <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </td>
                <td className="px-4 py-3 text-right">
                    <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
                </td>
                <td className="px-4 py-3 text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                </td>
            </tr>
        ));
    }
    return null;
};
