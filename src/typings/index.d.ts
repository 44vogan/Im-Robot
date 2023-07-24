type Action = {
    actionType:
    | "Move Mouse"
    | "Press key"
    | "Send Text"
    | "移动鼠标"
    | "按键"
    | "发送文字"; //Move Mouse(relative to image location,absolute),Press(Key, Special Key),Send Text
    moveType: "relative" | "absolute";
    coor: number[];
    keyType: "0-9,a-z" | "special key" | "特殊按键";
    key: string;
    specialKey: string;
    pressDuration: number;
    text: string;
    delay: number;
};
type Rule = {
    confidence: number;
    imagePath: string;
    imageName: string;
    ruleName: string;
    actions: Action[];
    enabled: boolean;
};