/** 单个星座的基础资料。 */
export interface ZodiacData {
    id: string;
    name: string;
    symbol: string;
    element: string;
    personality: string[];
    loveStyle: string;
    communication: string;
    strengths: string[];
    weaknesses: string[];
    icon: string;
}

/** 星座选项点击回调。 */
export type ZodiacItemClickHandler = (data: ZodiacData) => void;
