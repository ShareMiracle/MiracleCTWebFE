<template>
    <div
        :ref="el => slider.element = el"
        class="k-slider"
        :style="sliderBarContainerStyle"
    >
        <div class="k-slider-bar" :style="sliderBarStyle">
            <span></span>
            <transition name="main-fade" mode="out-in">
                <div
                    v-show="slider.showFormatText"
                    class="k-slider-format-text"
                    :style="sliderFormatTextStyle"
                >
                    {{ slider.formatText }}
                </div>
            </transition>
        </div>
        <div
            v-if="props.showStops"
            class="k-slider-grid-container"
        >
            <div
                v-for="(grid, index) of slider.grids"
                :key="index"
                :style="grid.style"
                class="k-slider-grid"
            />
        </div>
    </div>
</template>

<script>
/* eslint-disable */
import { reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { debounce } from '@/hook/debounce';

export default {
    name: 'k-slider',
    props: {
        modelValue: {
            type: Number,
            required: true
        },
        min: {
            type: Number,
            default: 1
        },
        max: {
            type: Number,
            default: 10
        },
        step: {
            type: Number,
            default: 1
        },
        height: {
            type: String,
            default: '20px'
        },
        sliderColor: {
            type: String,
            default: 'rgba(128, 30, 255, 0.3)'
        },
        sliderBarColor: {
            type: String,
            default: 'rgba(128, 30, 255, 0.3)'
        },
        formatTooltip: {
            type: Function,
            default: () => undefined
        },
        showStops: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue'],
    setup(props, ctx) {
        
        const slider = reactive({
            pressed: false,
            element: null,
            width: 0,
            cursor: 'grab',
            transition: 'unset',
            showFormatText: true,
            formatText: '',
            hideFormatText: debounce(() => {
                // slider.showFormatText = false;
            }, 2000),
            grids: []
        });

        function getBarOffsetX() {
            let actualLeft = slider.element.offsetLeft;
            let current = slider.element.offsetParent;
            while (current !== null){
                actualLeft += current.offsetLeft;
                current = current.offsetParent;
            }
            return actualLeft;
        }

        function getBarWidth() {
            return slider.element.offsetWidth;
        }
    
        const sliderBarContainerStyle = computed(() => ({
            height: props.height,
            backgroundColor: props.sliderColor
        }));

        const sliderBarStyle = computed(() => ({
            backgroundColor: props.sliderBarColor,
            width: slider.width + 'px',
            cursor: slider.cursor,
            transition: slider.transition
        }));

        const sliderFormatTextStyle = computed(() => ({
            cursor: slider.cursor,
            transition: slider.transition
        }));

        function updateValue(value) {
            ctx.emit('update:modelValue', value);
            const formatValue = props.formatTooltip(value);
            if (formatValue !== undefined) {
                slider.formatText = formatValue;
                slider.showFormatText = true;
                slider.hideFormatText();
            }
        }

        function roundOffValue(value, min, step) {
            if ((value - min) % step === 0) {
                return value;
            } else {
                const divResult = (value - min) / step;
                const uppervalue = Math.ceil(divResult) * step + min;
                const lowervalue = Math.floor(divResult) * step + min;
                if ((uppervalue - value) < (value - lowervalue)) {
                    return uppervalue;
                } else {
                    return lowervalue;
                }
            }
        }

        function update(event) {
            const x = event.x - getBarOffsetX();
            const barWidth = getBarWidth();
            const percent = x / barWidth;
            // 分两种情况： step 是整数和非整数
            if (props.step % 1 === 0) {
                const value = props.min + (props.max - props.min) * percent;
                const actualValue = roundOffValue(value, props.min, props.step);
                const actualX = (actualValue - props.min) / (props.max - props.min) * barWidth;
                slider.width = actualX;
                updateValue(actualValue);
            } else {
                let floatLength = String(props.step).split('.').at(-1).length;
                // 太长就不干了
                floatLength = Math.min(22, floatLength);
                const ratio = Math.pow(10, floatLength);
                const scaleMin = props.min * ratio;
                const scaleMax = props.max * ratio;
                const scaleStep = parseInt(props.step * ratio);

                const scaleValue = scaleMin + (scaleMax - scaleMin) * percent;
                const actualScaleValue = roundOffValue(scaleValue, scaleMin, scaleStep);
                const actualX = (actualScaleValue - scaleMin) / (scaleMax - scaleMin) * barWidth;
                slider.width = actualX;
                const actualValue = actualScaleValue / ratio;
                updateValue(actualValue);
            }
        }

        nextTick(() => {
            const percent = (props.modelValue - props.min) / (props.max - props.min);
            slider.width = percent * getBarWidth();
        });

        onMounted(() => {
            if (!(slider.element instanceof HTMLElement)) {
                return;
            }

            if (props.showStops) {
                // 先计算出需要多少根条
                let gridNum = Math.floor((props.max - props.min) / props.step);
                if ((props.max - props.min) % props.step === 0) {
                    gridNum --;
                }
                
                // 太多就不渲染了
                if (gridNum <= 50) {
                    const gridRelativeWidth = props.step / (props.max - props.min);
                    // 根据宽度计算每根的参数
                    let currentLeft = 0;
                    for (let i = 0; i < gridNum; ++ i) {
                        currentLeft += gridRelativeWidth * 100;
                        const gridInfo = {
                            style: `left: ${currentLeft}%;`
                        }
                        slider.grids.push(gridInfo);
                    }
                }
            }

            slider.element.onmousedown = () => {
                slider.pressed = true;
                slider.cursor = 'grabbing';
                slider.transition = 'unset';
            }
            slider.element.onmouseup = () => {
                slider.pressed = false;
                slider.cursor = 'grab';
                slider.transition = 'unset';
            }
            slider.element.onmousemove = event => {
                if (slider.pressed) {
                    update(event);
                }
            }
            slider.element.onclick = event => {
                slider.transition = '.35s ease';
                update(event);
            }

            const formatValue = props.formatTooltip(props.modelValue);
            if (formatValue !== undefined) {
                slider.formatText = formatValue;
                slider.showFormatText = true;
            }
        });

        onUnmounted(() => {
            if (!(slider.element instanceof HTMLElement)) {
                return;
            }

            slider.element.onmousedown = () => {}
            slider.element.onmouseup = () => {}
            slider.element.onmouseover = () => {}
            slider.element.onclick = () => {}
        });

        return {
            props,
            slider,
            sliderBarStyle,
            sliderBarContainerStyle,
            sliderFormatTextStyle
        }
    }
}
</script>

<style>
.k-slider {
    border-radius: .8em;
    overflow: hidden;
    position: relative;
    width: 100%;
    cursor: pointer;
}

.k-slider::before {
    content: "-";
    font-size: 1.5rem;
    color: white;
    height: 100%;
    position: absolute;
    top: -5%;
    left: 7px;
    display: flex;
    align-items: center;
    z-index: 5;
}

.k-slider::after {
    content: "+";
    font-size: 1.5rem;
    color: white;
    height: 100%;
    position: absolute;
    top: -5%;
    right: 7px;
    display: flex;
    align-items: center;
    z-index: 5;
}

.k-slider-bar {
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    border-radius: .5em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 4;
}

.k-slider-grid-container {
    height: 100%;
    width: 100%;
    position: relative;
    z-index: 3;
}

.k-slider-grid {
    position: absolute;
    height: 100%;
    width: 5px;
    background-color: rgba(255, 255, 255, 0.7);
}

.k-slider-format-text {
    color: white;
    padding-right: 5px;
    font-size: 1rem;
    white-space: nowrap;
    user-select: none;
    font-family: var(--base-font);
}
</style>