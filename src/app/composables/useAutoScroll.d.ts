import { type Ref } from "vue";
interface AutoScrollOptions {
    stickThresholdPx?: number;
}
export declare function useAutoScroll(itemCount: Ref<number>, options?: AutoScrollOptions): {
    containerRef: Ref<HTMLElement | null, HTMLElement | null>;
    handleScroll: () => void;
    scrollToBottom: (force?: boolean) => Promise<void>;
};
export {};
