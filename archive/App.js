// App.js
import { generateStory, generateIllustrationPrompt, generateAudioFromText,
     generateImageFromPrompt } from './genai-service.js';

// Embed the decodeAudioData function directly for simplicity
/**
 * Decodes a Base64 encoded raw PCM audio string into an AudioBuffer.
 * This function does not use AudioContext.decodeAudioData, as it's designed for raw PCM data
 * which lacks standard file headers (like WAV or MP3).
 *
 * @param {string} base64PcmString The Base64 encoded raw PCM audio data.
 * @param {number} sampleRate The sample rate of the PCM data (e.g., 44100).
 * @param {number} numberOfChannels The number of audio channels (e.g., 1 for mono, 2 for stereo).
 * @param {number} bitDepth The bit depth of the PCM data (e.g., 16 for 16-bit signed integers).
 * @returns {Promise<AudioBuffer>} A Promise that resolves with the decoded AudioBuffer.
 */
async function decodeAudioData(base64PcmString, sampleRate, numberOfChannels, bitDepth) {
    if (typeof AudioContext === 'undefined') {
        console.warn('AudioContext is not available in this environment. Audio playback will not work.');
        return null;
    }

    const binaryString = atob(base64PcmString);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const dataView = new DataView(bytes.buffer);
    const bytesPerSample = bitDepth / 8;
    const totalSamples = len / bytesPerSample;
    const samplesPerChannel = totalSamples / numberOfChannels;

    const audioContext = new AudioContext({ sampleRate: sampleRate });
    const audioBuffer = audioContext.createBuffer(numberOfChannels, samplesPerChannel, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
        const nowBuffering = audioBuffer.getChannelData(channel);
        for (let i = 0; i < samplesPerChannel; i++) {
            let value;
            const byteOffset = (i * numberOfChannels + channel) * bytesPerSample;

            if (bitDepth === 16) {
                value = dataView.getInt16(byteOffset, true); // true for little-endian
                nowBuffering[i] = value / 32768;
            } else if (bitDepth === 32) {
                value = dataView.getFloat32(byteOffset, true); // true for little-endian
                nowBuffering[i] = value;
            } else {
                console.error(`Unsupported bit depth: ${bitDepth}. Only 16-bit signed int and 32-bit float are supported.`);
                audioContext.close();
                return null;
            }
        }
    }
    audioContext.close();
    return audioBuffer;
}


const { useState, useEffect, createElement: e } = React;

const StorytellerApp = () => {
    const [childName, setChildName] = useState('');
    const [storyTheme, setStoryTheme] = useState('');
    const [mainCharacter, setMainCharacter] = useState('');
    const [moral, setMoral] = useState('');
    const [storyLength, setStoryLength] = useState('Medium');
    const [illustrationPrompt, setIllustrationPrompt] = useState('');
    const [generatedStory, setGeneratedStory] = useState('');
    const [generatedIllustrationDescription, setGeneratedIllustrationDescription] = useState('');
    const [generatedIllustrationUrl, setGeneratedIllustrationUrl] = useState(''); // New state for illustration URL
    const [generatedAudio, setGeneratedAudio] = useState(''); // New state for audio
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setGeneratedStory('');
        setGeneratedIllustrationDescription('');
        setGeneratedIllustrationUrl(''); // Clear previous illustration URL
        setGeneratedAudio(''); // Clear previous audio
        setIsLoading(true);

        try {
            // Check for API key before proceeding
            if (window.aistudio && !window.aistudio.hasSelectedApiKey()) {
                window.aistudio.openSelectKey();
                throw new Error("Please select a paid API key to generate content.");
            }

            const story = await generateStory({
                childName,
                storyTheme,
                mainCharacter,
                moral,
                storyLength
            });
            setGeneratedStory(story);

            // Generate illustration prompt based on the story
            const illPrompt = await generateIllustrationPrompt(story, illustrationPrompt);
            setGeneratedIllustrationDescription(illPrompt);

            // Generate image from the illustration prompt
            const imageUrl = await generateImageFromPrompt(illPrompt);
            setGeneratedIllustrationUrl(imageUrl);

            // Generate audio from the story text
            const audio = await generateAudioFromText(story);
            setGeneratedAudio(audio);

        } catch (err) {
            console.error("Application error:", err);
            setError(err.message || "An unexpected error occurred during story generation.");
        } finally {
            setIsLoading(false);
        }
    };

    const playGeneratedAudio = async () => {
        if (generatedAudio) {
            await playAudio(generatedAudio);
        } else {
            console.warn("No audio to play. Generate a story first.");
        }
    };

    const playAudio = async (base64Audio) => {
        if (!base64Audio) return;
        try {
            const audioBuffer = await decodeAudioData(base64Audio, 24000, 1, 16); // Assuming 24kHz, 1 channel, 16-bit
            if (audioBuffer) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
            }
        } catch (err) {
            console.error("Error playing audio:", err);
        }
    };


    return e('div', { className: 'flex flex-col lg:flex-row gap-8 p-4' },
        // Left Pane: Input Form
        e('div', { className: 'lg:w-1/2 p-6 bg-gradient-to-br from-purple-300 via-pink-300 to-yellow-300 rounded-lg shadow-xl flex-shrink-0' },
            e('h2', { className: 'text-3xl font-bold text-white mb-6 text-center' }, "Create Your Story"),
            e('form', { onSubmit: handleSubmit, className: 'space-y-4' },
                e('div', null,
                    e('label', { htmlFor: 'childName', className: 'block text-white text-lg font-medium mb-2' }, "Child's Name:"),
                    e('input', {
                        type: 'text',
                        id: 'childName',
                        className: 'w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500',
                        value: childName,
                        onChange: (e) => setChildName(e.target.value),
                        required: true
                    })
                ),
                e('div', null,
                    e('label', { htmlFor: 'storyTheme', className: 'block text-white text-lg font-medium mb-2' }, "Story Theme:"),
                    e('input', {
                        type: 'text',
                        id: 'storyTheme',
                        className: 'w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500',
                        value: storyTheme,
                        onChange: (e) => setStoryTheme(e.target.value),
                        required: true
                    })
                ),
                e('div', null,
                    e('label', { htmlFor: 'mainCharacter', className: 'block text-white text-lg font-medium mb-2' }, "Main Character:"),
                    e('input', {
                        type: 'text',
                        id: 'mainCharacter',
                        className: 'w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500',
                        value: mainCharacter,
                        onChange: (e) => setMainCharacter(e.target.value),
                        required: true
                    })
                ),
                e('div', null,
                    e('label', { htmlFor: 'moral', className: 'block text-white text-lg font-medium mb-2' }, "Moral (Optional):"),
                    e('input', {
                        type: 'text',
                        id: 'moral',
                        className: 'w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500',
                        value: moral,
                        onChange: (e) => setMoral(e.target.value)
                    })
                ),
                e('div', null,
                    e('label', { htmlFor: 'storyLength', className: 'block text-white text-lg font-medium mb-2' }, "Story Length:"),
                    e('select', {
                        id: 'storyLength',
                        className: 'w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500',
                        value: storyLength,
                        onChange: (e) => setStoryLength(e.target.value)
                    },
                        e('option', { value: 'Short' }, 'Short (3-4 pages)'),
                        e('option', { value: 'Medium' }, 'Medium (5-6 pages)'),
                        e('option', { value: 'Long' }, 'Long (7-8 pages)')
                    )
                ),
                e('div', null,
                    e('label', { htmlFor: 'illustrationPrompt', className: 'block text-white text-lg font-medium mb-2' }, "Illustration Idea (Optional):"),
                    e('textarea', {
                        id: 'illustrationPrompt',
                        className: 'w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 h-24',
                        value: illustrationPrompt,
                        onChange: (e) => setIllustrationPrompt(e.target.value)
                    })
                ),
                e('button', {
                    type: 'submit',
                    className: 'w-full bg-purple-600 text-white p-3 rounded-md font-semibold hover:bg-purple-700 transition-colors duration-200',
                    disabled: isLoading
                }, isLoading ? 'Generating...' : 'Generate Story')
            ),
            error && e('p', { className: 'text-red-500 mt-4' }, error)
        ),

        // Right Pane: Story Display
        e('div', { className: 'lg:w-1/2 p-6 bg-amber-100 rounded-lg shadow-xl relative overflow-hidden flex flex-col' },
            e('div', { className: 'absolute inset-0 bg-amber-100 transform -skew-y-3 rotate-3 scale-105 z-0 opacity-50' }), // Parchment effect
            e('div', { className: 'relative z-10 flex-grow overflow-y-auto custom-scrollbar p-4' }, // Custom scrollbar
                e('h2', { className: 'text-3xl font-bold text-gray-800 mb-6 text-center' }, "Your Magical Story"),
                isLoading && e('p', { className: 'text-center text-gray-600' }, "A magical tale is being woven..."),
                generatedStory && e('div', { className: 'text-gray-700 text-lg leading-relaxed whitespace-pre-wrap' }, generatedStory),
                generatedIllustrationDescription && e('div', { className: 'mt-6 p-4 bg-amber-200 rounded-md border border-amber-300' },
                    e('h3', { className: 'text-xl font-semibold text-gray-800 mb-2' }, "Illustration Idea:"),
                    e('p', { className: 'text-gray-700' }, generatedIllustrationDescription),
                    e('p', { className: 'text-sm text-gray-600 mt-2' }, "(This is a prompt for an image generator, not an actual image.)")
                ),
                generatedIllustrationUrl && e('div', { className: 'mt-4 flex justify-center' },
                    e('img', { src: generatedIllustrationUrl, alt: 'Story Illustration Placeholder', className: 'max-w-full h-auto rounded-lg shadow-md' })
                ),
                generatedStory && e('button', {
                    onClick: playGeneratedAudio,
                    className: 'mt-4 w-full bg-green-600 text-white p-3 rounded-md font-semibold hover:bg-green-700 transition-colors duration-200',
                    disabled: isLoading
                }, 'Play Story')
            )
        )
    );
};

ReactDOM.render(e(StorytellerApp), document.getElementById('root'));



