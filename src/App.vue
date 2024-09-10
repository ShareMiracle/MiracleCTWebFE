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

            <p id="fileName"></p>
            
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

import KSlider from '@/components/KSlider.vue';

const textResult = ref('');
const userInputText = ref('');
const notification = reactive({
    show: false,
    content: ''
});
let userFile: File | undefined = undefined;
const uploaded = ref(false);

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

    const form = new FormData();
    form.append('file', userFile);
    form.append('text', userText);
    textResult.value = 'Please waiting ...';
    const response = await fetch('http://bacteria.tech:6004/upload', { method: 'POST', body: form });
    const resJson = await response.json();
    if (resJson) {
        const data = resJson.data;
        const message = data.message;
        textResult.value = message;
    } else {
        console.log('fail fetch');
    }
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
}

.app-container {
    margin-top: 100px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.main {
    margin: 20px;
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


</style>
