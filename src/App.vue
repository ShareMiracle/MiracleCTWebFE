<template>
    <div class="app-container">
        <div class="main">
            <br>
            <input type="file" id="fileInput" accept=".nii.gz" style="display: none;" @change="onFileChange">

            <div class="input-section">
                <button class="button is-link" onclick="document.getElementById('fileInput').click()">
                    Choose File
                </button>
                <input
                    v-model="userInputText"
                    type="text"
                    id="text-input"
                    class="input is-link"
                    placeholder="Description Input"
                />
            </div>

            <div class="setting">
                <div class="do-sample">
                    <input type="checkbox" id="do-sample" v-model="doSample">
                    <label for="do-sample">do sample</label>
                </div>
                <div v-show="doSample" class="setting-slider-container">
                    <div class="slider-item">
                        <span>temperature</span>
                        <div>
                            <KSlider
                                v-model="temperature"
                                :min="0"
                                :max="1"
                                height="30px"
                                :step="0.1"
                                :sliderColor="'rgba(66, 88, 255, 0.3)'"
                                :sliderBarColor="'rgba(66, 88, 255, 0.7)'"
                                :formatTooltip="(v) => v"
                            />
                        </div>
                    </div>
                    <div class="slider-item">
                        <span>top p</span>
                        <div>
                        <KSlider
                            v-model="topP"
                            :min="0"
                            :max="1"
                            height="30px"
                            :step="0.1"
                            :sliderColor="'rgba(66, 88, 255, 0.3)'"
                            :sliderBarColor="'rgba(66, 88, 255, 0.7)'"
                            :formatTooltip="(v) => v"
                        />
                       </div>
                    </div>
                </div>
            </div>
            
            <div class="notification is-link" v-show="notification.show">
                <button class="delete" @click="notification.show = false"></button>
                {{ notification.content }}
            </div>
        </div>

        <div class="card ct-card">
            <header class="card-header">
                <p class="card-header-title">Miracle CT</p>
                <button class="card-header-icon" aria-label="more options">
                    <span class="icon">
                        <i class="fas fa-angle-down" aria-hidden="true"></i>
                    </span>
                </button>
            </header>
            <div class="card-image">
                <figure class="image is-4by3" v-show="!uploaded">
                    <span class="blank-desc" onclick="document.getElementById('fileInput').click()">upload .nii.gz</span>
                </figure>
                <figure class="niigz-container image is-4by3" v-show="uploaded">
                    <img id="nifti-image" src="" alt="" style="display: none;">
                    <canvas id="nifti-canvas" width="800" height="800"></canvas>

                    <input  id="nifti-slider" type="range" min="0" max="100" value="0" class="slider" >
                    <br />
                </figure>

            </div>
            <div class="card-content">
                <div class="content">
                    <span :class="isloading ? 'loader': 'finish-loader '"></span>
                    <div id="text-content">{{ textResult }}</div>
                </div>
            </div>
            <footer class="card-footer">
                <a href="#" class="card-footer-item is-primary" @click="uploadNiigz">Upload</a>
                <a href="#" class="card-footer-item is-primary" @click="deleteNiigz">Delete</a>
            </footer>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import * as nifti from '@/hook/nifti';
import KSlider from './components/KSlider.vue';

const textResult = ref('');
const userInputText = ref('');
const notification = reactive({
    show: false,
    content: ''
});
let userFile: File | undefined = undefined;

const isloading = ref(false);
const uploaded = ref(false);

const doSample = ref(true);
const temperature = ref(0.2);
const topP = ref(0.7);

onMounted(async () => {
    textResult.value = 'Untitled CT Detection';

    nifti.params._readniiCallback = header => {
        const dims = header.dims;
        CtFile.imageHeight = dims[2];
        CtFile.imageWidth = dims[1];
        CtFile.imageSlices = dims[3];
    };
    nifti.params._current_sliceCallback = currentSlice => {
        CtFile.currentSlice = currentSlice
    }
});

async function onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files === null) {
        return;
    }

    nifti.handleFileSelect(event);
    const file = target.files[0];
    if (file) {
        userFile = file;
        uploaded.value = true;
    }
}

const CtFile = reactive({
    showSlider: false,
    currentSlice: 0,
    imageHeight: 0,
    imageWidth: 0,
    imageSlices: 0,
});

async function uploadNiigz() {
    if (userFile === undefined) {
        notification.content = 'Please upload .nii.gz !';
        notification.show = true;
        return;
    }
    const userText = userInputText.value.trim();
    if (userText.length === 0) {
        notification.content = 'Please enter the description !';
        notification.show = true;
        return;
    }

    notification.show = false;
    isloading.value = true;

    const form = new FormData();
    form.append('file', userFile);
    form.append('text', userText);
    form.append('do_sample', doSample.value + '');
    form.append('temperature', temperature.value + '');
    form.append('top_p', topP.value + '');

    textResult.value = 'Please waiting ...';
    const response = await fetch('http://bacteria.tech:6004/upload', {
        method: 'POST',
        body: form,
    });
    try {
        const resJson = await response.json();
        const data = resJson.data;
        textResult.value = data;
    } catch (error) {
        console.log('fail to fetch, reason:', error);
    }
    isloading.value = false;
}

async function deleteNiigz() {
    userFile = undefined;
    uploaded.value = false;
    textResult.value = 'Untitled CT Detection';
    userInputText.value = '';
}

</script>

<style>
:root {
    --miracle-display-width: 670px;
    --main-color: var(--bulma-link);
    --font-main-color: var(--bulma-body-color);
}

.app-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.main {
    margin: 10px;
    width: var(--miracle-display-width);
}


.ct-card {
    margin: 20px;
    width: var(--miracle-display-width);
}

.input-section {
    padding: 10px;
    display: flex;
}

#text-input {
    margin-left: 10px;
}
.notification {
    margin-top: 10px;
}

.niigz-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

#nifti-canvas {
    width: var(--miracle-display-width);
}

.blank-desc {
    width: var(--miracle-display-width);
    height: var(--miracle-display-width);
    cursor: pointer;
    font-size: 45px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slider {
    width: var(--miracle-display-width);
}

.content {
    display: flex;
    align-items: center;
}

.loader {
  border: 5px solid var(--bulma-body-color);
  border-top: 5px solid var(--bulma-link);
  border-radius: 50%; /* 圆形 */
  width: 30px;
  height: 30px;
  animation: spin 2s linear infinite; /* 应用旋转动画 */
  margin-right: 20px;
}

.finish-loader {
    border: 5px solid var(--bulma-link);
    border-radius: 50%; /* 圆形 */
    width: 30px;
    height: 30px;
    margin-right: 20px;
}

.slider-item {
    display: flex;
    justify-content: left;
    align-items: center;
    height: 45px;
}

.slider-item > span {
    margin-left: 10px;
    margin-right: 10px;
    width: 100px;
    font-size: 1.0rem;
}


.setting {
    padding: 10px;
    user-select: none;
    display: flex;
}



.do-sample {
    width: 130px;
}

.setting-slider-container {
    width: 550px;
    display: flex;
    flex-direction: column;
    align-items: left;
    border: 1px solid var(--main-color);
    padding-top: 10px;
    padding-bottom: 10px;
    border-radius: .7em;
}

.slider-item > div {
    width: 400px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
