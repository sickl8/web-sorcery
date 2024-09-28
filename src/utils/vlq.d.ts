declare module "vlq" {
    export function encode(num: number): string;
    export function encode(nums: number[]): string;
    export function decode(str: string): number[];
}