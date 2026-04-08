# CS889 Final Project — Spoiler-Aware Storyline Visualization for Novels

## Project Overview
This repository contains the source code and supporting files for my CS889 final project, an interactive, character-centric, spoiler-aware storyline visualization for novels.

The main prototype uses **The Hunger Games trilogy** as its primary case study and explores how storyline visualization can be adapted from a retrospective analytical tool into a more communication-oriented reading aid. The system is designed for **readers, teachers, and book clubs**, and supports guided exploration of character dynamics, narrative structure, and temporal order while remaining sensitive to partial reading progress.

A secondary prototype based on **Inception** was also developed as a small extension study. This version explores whether the same scene-and-character abstraction can support more layered temporal structure and simultaneous interaction bands.

The project was developed primarily in **Observable** using **D3** and then exported as a runnable local package.

## Live Observable Notebooks

### Main prototype: The Hunger Games
Original Observable notebook:
**https://observablehq.com/d/18362fc7f6c3aafc**

### Secondary prototype: Inception
Observable notebook:
**https://observablehq.com/d/c13b35b6237b335b**

The Hunger Games prototype is the main project implementation. The Inception prototype is a smaller secondary experiment used to test the flexibility of the design on a more layered narrative structure.

## Repository Contents
This repository includes the Observable export and the required data files.

### Source / exported notebook files
- `notebook module.js` — main exported Observable notebook module
- `index.html` — browser entry point for the exported notebook
- `index.js` — module entry / re-export
- `runtime.js` — Observable runtime
- `inspector.css` — Observable styling
- `package.json` — package metadata

## Expected Dataset Inputs

The main prototype expects two JSON data files:

1. `hunger_games_3_books_chapter_sessions_enriched.json`  
   Chapter-based interaction/session data used for the chapter-order view.

2. `hunger_games_in_story_timeline_complete_renumbered.json`  
   In-story timeline data used for chronology-based exploration.

If these files are missing or renamed, the exported notebook may fail to load correctly.

## How to Run the Project

### Option 1 — Run in Observable
This is the recommended way to view the project.

#### Main prototype
1. Open the notebook:  
   **https://observablehq.com/d/18362fc7f6c3aafc**
2. Ensure the required datasets are available in the notebook environment.
3. Run or inspect the notebook normally in Observable.

#### Secondary prototype
1. Open the notebook:  
   **https://observablehq.com/d/c13b35b6237b335b**
2. Run or inspect the notebook normally in Observable.

### Option 2 — Run the exported version locally
The exported notebook can also be run locally through a simple static web server.

#### Step 1: Place all required files together
Make sure the following are present in the same project directory:
- exported Observable files
- the two required JSON dataset files

#### Step 2: Start a local web server

View this notebook in your browser by running a web server in this folder. For
example:

~~~sh
npx http-server
~~~

Or, use the [Observable Runtime](https://github.com/observablehq/runtime) to
import this module directly into your application. To npm install:

~~~sh
npm install @observablehq/runtime@5
npm install https://api.observablehq.com/d/18362fc7f6c3aafc@837.tgz?v=3
~~~

Then, import the notebook and the runtime as:

~~~js
import {Runtime, Inspector} from "@observablehq/runtime";
import define from "18362fc7f6c3aafc";
~~~

To log the value of the cell named “foo”:

~~~js
const runtime = new Runtime();
const main = runtime.module(define);
main.value("foo").then(value => console.log(value));
~~~

Then open `index.html` through that local server.

## Notes
- This is a research prototype developed in Observable with D3.
- Some semantic metadata including faction and relationship labels was manually curated.
- The Hunger Games notebook is the primary final-project implementation.
- The Inception notebook is a smaller secondary prototype demonstrating possible extension to narratives with more simultaneous interaction bands and layered temporal structure.


