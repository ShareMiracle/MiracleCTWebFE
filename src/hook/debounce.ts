let DEBOUNSE_DO_TIMER: number | undefined = undefined;

export function debounceDo(fn: (...arg: any[]) => any, delay: number) {
    if (DEBOUNSE_DO_TIMER !== undefined) {
        clearTimeout(DEBOUNSE_DO_TIMER);
    }
    DEBOUNSE_DO_TIMER = setTimeout(fn, delay);
}


export function debounce(fn: (...arg: any[]) => any, delay: number) {
    let timer: undefined | number = undefined;
    return function () {
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => {
            fn()
        }, delay)
    }
}