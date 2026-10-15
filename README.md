# Sprites · Livive

A browser-based 3D-to-sprite workshop. Preview turntable views and animation frames from GLB/glTF models, then export sprite sheets or cropped single sprites. For the oblique scene sandbox, visit <https://oblique.livive.net/>.

## Run locally

```sh
./run.sh
```

Open <http://127.0.0.1:8000>. The site is static; Python is used only to serve the local files. Three.js is loaded from jsDelivr, so a network connection is required. Models and the catalog are in `models/`.

The main page provides the Turntable preview. Model catalog entries live in `models/models.json`; model assets are stored in `models/assets/`.
