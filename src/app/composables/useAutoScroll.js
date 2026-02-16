import { nextTick, onMounted, ref, watch } from "vue";
export function useAutoScroll(itemCount, options = {}) {
    const containerRef = ref(null);
    const stickToBottom = ref(true);
    const stickThresholdPx = options.stickThresholdPx ?? 72;
    function handleScroll() {
        const element = containerRef.value;
        if (!element) {
            return;
        }
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        stickToBottom.value = distanceFromBottom <= stickThresholdPx;
    }
    async function scrollToBottom(force = false) {
        await nextTick();
        const element = containerRef.value;
        if (!element) {
            return;
        }
        if (force || stickToBottom.value) {
            element.scrollTop = element.scrollHeight;
        }
    }
    watch([itemCount, containerRef], () => {
        void scrollToBottom();
    }, { flush: "post" });
    onMounted(() => {
        void scrollToBottom(true);
    });
    return {
        containerRef,
        handleScroll,
        scrollToBottom
    };
}
