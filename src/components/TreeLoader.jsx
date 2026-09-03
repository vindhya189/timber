import React from "react";
import "./TreeLoader.css";

export default function TreeLoader({
  text = "Growing TimberMart..."
}) {
  return (
    <div className="tree-loader-page">
      <div className="tree-loader">

        {/* Ground */}
        <div className="tree-ground"></div>

        {/* Animated tree */}
        <div className="tree-animation">

          {/* Seed */}
          <div className="tree-seed"></div>

          {/* Stem */}
          <div className="tree-stem"></div>

          {/* Branches */}
          <div className="tree-branch tree-branch-left"></div>
          <div className="tree-branch tree-branch-right"></div>

          {/* Leaves */}
          <div className="tree-leaf leaf-1"></div>
          <div className="tree-leaf leaf-2"></div>
          <div className="tree-leaf leaf-3"></div>
          <div className="tree-leaf leaf-4"></div>
          <div className="tree-leaf leaf-5"></div>
          <div className="tree-leaf leaf-6"></div>
          <div className="tree-leaf leaf-7"></div>
          <div className="tree-leaf leaf-8"></div>

        </div>

        <div className="tree-loader-brand">
          <span>TimberMart</span>
        </div>

        <p className="tree-loader-text">
          {text}
        </p>

        <div className="tree-loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>
    </div>
  );
}