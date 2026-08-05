/** 星座在亲密关系中的个性化表达素材。 */
export interface ZodiacRelationshipProfile {
    gift: string;
    emotionalNeed: string;
    pressureResponse: string;
    repair: string;
    dateStyle: string;
    dateIdea: string;
}

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
    relationship: ZodiacRelationshipProfile;
    icon: string;
}

/** 星座选项点击回调。 */
export type ZodiacItemClickHandler = (data: ZodiacData) => void;
