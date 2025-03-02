import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";

import config from "../config/config";
import state from "../store";
import { download } from "../assets";
import { downloadCanvasToImage, reader } from "../config/helpers";
import { EditorTabs, FilterTabs, DecalTypes } from "../config/constants";
import { fadeAnimation, slideAnimation } from "../config/motion";
import {
  AIPicker,
  ColorPicker,
  CustomButton,
  FilePicker,
  Tab,
} from "../components";
import { CloseButton } from "@chakra-ui/close-button";

const Customizer = () => {
  const snap = useSnapshot(state);

  const [file, setFile] = useState("");
  const [onclose, setonClose] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatingImg, setGeneratingImg] = useState(false);

  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  });

  // show tab content depending on the activeTab
  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "colorpicker":
        return (
          !onclose && (
            <div className="editorContent">
              <ColorPicker />
              <CloseButton
                className="close"
                onClick={(prevState) => {
                  setonClose((prevState) => !prevState);
                }}
              />
            </div>
          )
        );
      case "filepicker":
        return (
          !onclose && (
            <div className="editorContent">
              <FilePicker
                file={file}
                setFile={setFile}
                readFile={readFile}
                className="content"
              />
              <CloseButton
                className="close"
                onClick={(prevState) => {
                  setonClose((prevState) => !prevState);
                }}
              />
            </div>
          )
        );
      case "aipicker":
        return (
          !onclose && (
            <div className="editorContent">
              <AIPicker
                prompt={prompt}
                setPrompt={setPrompt}
                generatingImg={generatingImg}
                handleSubmit={handleSubmit}
              />
              <CloseButton
                className="close"
                onClick={(prevState) => {
                  setonClose((prevState) => !prevState);
                }}
              />
            </div>
          )
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (type) => {
    if (!prompt) return alert("Please enter a prompt");

    try {
      setGeneratingImg(true);

      const response = await fetch("http://localhost:8080/api/v1/dalle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await response.json();

      handleDecals(type, `data:image/png;base64,${data.photo}`);
    } catch (error) {
      alert(error);
    } finally {
      setGeneratingImg(false);
      setActiveEditorTab("");
    }
  };

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];

    state[decalType.stateProperty] = result;

    if (!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab);
    }
  };

  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case "logoShirt":
        state.isLogoTexture = !activeFilterTab[tabName];
        break;
      case "stylishShirt":
        state.isFullTexture = !activeFilterTab[tabName];
        break;
      default:
        state.isLogoTexture = true;
        state.isFullTexture = false;
        break;
    }

    // after setting the state, activeFilterTab is updated

    setActiveFilterTab((prevState) => {
      return {
        ...prevState,
        [tabName]: !prevState[tabName],
      };
    });
  };

  const readFile = (type) => {
    reader(file).then((result) => {
      handleDecals(type, result);
      setActiveEditorTab("");
    });
  };

  return (
    <AnimatePresence>
      {!snap.intro && (
        <>
          <motion.div
            key="custom"
            className="absolute top-0 left-0 z-10"
            {...slideAnimation("left")}
          >
            <div className="flex items-center min-h-screen">
              <div className="editortabs-container tabs">
                {EditorTabs.map((tab) => (

  <div key={tab.name} className="relative">
    <Tab 
      tab={tab}
      handleClick={() => setActiveEditorTab(tab.name)}
    />
    {activeEditorTab === tab.name && (
      <div className="absolute top-0 left-0 transform -translate-y-full bg-gray-800 text-white px-2 py-1 text-xs rounded">
        {tab.name === "colorpicker" ? "Color Picker" : tab.name === "filepicker" ? "Filepicker" : "AI picker"}
      </div>
    )}
  </div>
))}
        

                {generateTabContent()}
              </div>
            </div>
            
          </motion.div>

          <motion.div
            className="absolute z-10 top-5 right-5"
            {...fadeAnimation}
          >
            <CustomButton
              type="filled"
              title="Go Back"
              handleClick={() => (state.intro = true)}
              customStyles="w-fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>

          <motion.div
            className="filtertabs-container"
            {...slideAnimation("up")}
          >
            {FilterTabs.map((tab) => (
              <Tab
                key={tab.name}
                tab={tab}
                isFilterTab
                isActiveTab={activeFilterTab[tab.name]}
                handleClick={() => handleActiveFilterTab(tab.name)}
              />
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Customizer;
