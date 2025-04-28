import React, { useEffect, useState } from 'react';

const allStories = {
    "The Cat Nap": [
      { text: "The cat sat.", img: "/images/cat-sit.png", audio: "/audio/the-cat-sat.mp3" },
      { text: "The cat napped.", img: "/images/cat-nap.png", audio: "/audio/the-cat-napped.mp3" },
      { text: "The cat got up.", img: "/images/cat-up.png", audio: "/audio/the-cat-got-up.mp3" },
      { text: "The cat ran.", img: "/images/cat-run.png", audio: "/audio/the-cat-ran.mp3" },
    ],
    "The Big Dog": [
      { text: "The dog ran.", img: "/images/dog-run.png", audio: "/audio/the-dog-ran.mp3" },
      { text: "The dog dug.", img: "/images/dog-dig.png", audio: "/audio/the-dog-dug.mp3" },
      { text: "The dog got a rug.", img: "/images/dog-rug.png", audio: "/audio/the-dog-got-a-rug.mp3" },
      { text: "The dog sat.", img: "/images/dog-sit.png", audio: "/audio/the-dog-sat.mp3" },
    ],
    "The Pig Can Dig": [
      { text: "The pig ran.", img: "/images/pig-run.png", audio: "/audio/the-pig-ran.mp3" },
      { text: "The pig did dig.", img: "/images/pig-dig.png", audio: "/audio/the-pig-did-dig.mp3" },
      { text: "The pig had mud.", img: "/images/pig-mud.png", audio: "/audio/the-pig-had-mud.mp3" },
      { text: "The pig was big.", img: "/images/pig-big.png", audio: "/audio/the-pig-was-big.mp3" },
    ],
    "The Wet Frog": [
      { text: "The fog was wet.", img: "/images/fog-wet.png", audio: "/audio/the-fog-was-wet.mp3" },
      { text: "The frog did hop.", img: "/images/frog-hop.png", audio: "/audio/the-frog-did-hop.mp3" },
      { text: "The frog got a bug.", img: "/images/frog-bug.png", audio: "/audio/the-frog-got-a-bug.mp3" },
      { text: "The frog had fun.", img: "/images/frog-fun.png", audio: "/audio/the-frog-had-fun.mp3" },
    ],
    "The Hen and Egg": [
      { text: "The hen sat.", img: "/images/hen-sit.png", audio: "/audio/the-hen-sat.mp3" },
      { text: "The hen had an egg.", img: "/images/hen-egg.png", audio: "/audio/the-hen-had-an-egg.mp3" },
      { text: "The egg did wig.", img: "/images/egg-wiggle.png", audio: "/audio/the-egg-did-wig.mp3" },
      { text: "Pop! A new chick.", img: "/images/chick.png", audio: "/audio/pop-a-new-chick.mp3" },
    ],
    "The Red Fin": [
      { text: "The fin was red.", img: "/images/fin-red.png", audio: "/audio/the-fin-was-red.mp3" },
      { text: "The fin did wag.", img: "/images/fin-wag.png", audio: "/audio/the-fin-did-wag.mp3" },
      { text: "The fin hit a log.", img: "/images/fin-log.png", audio: "/audio/the-fin-hit-a-log.mp3" },
      { text: "The fin hid.", img: "/images/fin-hid.png", audio: "/audio/the-fin-hid.mp3" },
    ],
    "The Car Zip": [
      { text: "The car can zip.", img: "/images/car-zip.png", audio: "/audio/the-car-can-zip.mp3" },
      { text: "The car did dip.", img: "/images/car-dip.png", audio: "/audio/the-car-did-dip.mp3" },
      { text: "The car hit a pit.", img: "/images/car-pit.png", audio: "/audio/the-car-hit-a-pit.mp3" },
      { text: "The car got up.", img: "/images/car-up.png", audio: "/audio/the-car-got-up.mp3" },
    ],
    "The Fun Bun": [
      { text: "The bun ran.", img: "/images/bun-run.png", audio: "/audio/the-bun-ran.mp3" },
      { text: "The bun had a hat.", img: "/images/bun-hat.png", audio: "/audio/the-bun-had-a-hat.mp3" },
      { text: "The bun met a bug.", img: "/images/bun-bug.png", audio: "/audio/the-bun-met-a-bug.mp3" },
      { text: "The bug sat too.", img: "/images/bug-sit.png", audio: "/audio/the-bug-sat-too.mp3" },
    ],
    "The Nap Mat": [
      { text: "The mat was big.", img: "/images/mat-big.png", audio: "/audio/the-mat-was-big.mp3" },
      { text: "Tim sat on the mat.", img: "/images/tim-mat.png", audio: "/audio/tim-sat-on-the-mat.mp3" },
      { text: "Tim had a nap.", img: "/images/tim-nap.png", audio: "/audio/tim-had-a-nap.mp3" },
      { text: "Tim got up.", img: "/images/tim-up.png", audio: "/audio/tim-got-up.mp3" },
    ],
    "The Goat Got It": [
      { text: "The goat got a map.", img: "/images/goat-map.png", audio: "/audio/the-goat-got-a-map.mp3" },
      { text: "The map had a dot.", img: "/images/map-dot.png", audio: "/audio/the-map-had-a-dot.mp3" },
      { text: "The goat did dig.", img: "/images/goat-dig.png", audio: "/audio/the-goat-did-dig.mp3" },
      { text: "The goat got a gem!", img: "/images/goat-gem.png", audio: "/audio/the-goat-got-a-gem.mp3" },
    ]
  };

interface StorybookProps {
  onQuit: () => void;
}

export default function Storybook({ onQuit }: StorybookProps) {
  const storyTitles = Object.keys(allStories);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);

  const pages = selectedStory ? allStories[selectedStory] : [];

  useEffect(() => {
    if (selectedStory && pages.length > 0) {
      const audio = new Audio(pages[storyIndex].audio);
      audio.play();
    }
  }, [storyIndex, selectedStory]);

  return (
    <div className="mt-6 w-full px-4 sm:px-6 md:px-8 text-center">
      {!selectedStory ? (
        <>
          <h2 className="text-2xl font-bold text-white mb-6">📖 Choose a Story</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storyTitles.map((title) => (
              <button
                key={title}
                onClick={() => {
                  setSelectedStory(title);
                  setStoryIndex(0);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-4 py-3 rounded-xl shadow-lg text-lg"
              >
                {title}
              </button>
            ))}
          </div>
          <button
            onClick={onQuit}
            className="mt-8 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-full"
          >
            ⬅️ Back to Home
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-white mb-4">{selectedStory}</h2>
          <img
            src={pages[storyIndex].img}
            alt="Story"
            className="w-full max-w-xs mx-auto rounded-xl shadow-lg mb-6"
          />
          <p className="text-3xl font-bold text-white mb-4">{pages[storyIndex].text}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setStoryIndex((prev) => Math.max(0, prev - 1))}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-full"
              disabled={storyIndex === 0}
            >
              ◀️ Back
            </button>
            <button
              onClick={() => setStoryIndex((prev) => Math.min(pages.length - 1, prev + 1))}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-full"
              disabled={storyIndex === pages.length - 1}
            >
              Next ▶️
            </button>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setSelectedStory(null)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full"
            >
              🔁 Back to All Stories
            </button>
            <button
              onClick={onQuit}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full"
            >
              🏠 Back to Home
            </button>
          </div>
        </>
      )}
    </div>
  );
}
