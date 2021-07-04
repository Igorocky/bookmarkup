"use strict";

function SelectedAreaRenderer() {
    function createRect({boundaries, key, color, opacity, borderColor, clipPath}) {
        return boundaries.toRect({
            key,
            props: {
                fill: color,
                fillOpacity: opacity,
                strokeWidth: borderColor ? 1 : 0,
                stroke: borderColor,
                clipPath
            }
        })
    }

    function createClipPath({id, svgBoundaries}) {
        const rectangles = []
        for (let i = 0; i < svgBoundaries.length; i++) {
            const b = svgBoundaries[i]
            const key = `selection-clip-path-${i}-${b.minX}-${b.minY}-${b.maxX}-${b.maxY}`
            rectangles.push(
                createRect({boundaries:b, key})
            )
        }
        return re('clipPath', {key:id, id}, rectangles)
    }

    function renderSelectedArea({
                                    key, svgBoundaries, focusedIdx = -1, color, clipPathId,
                                    renderSelections = true, renderLocalBoundaries = false,
                                renderOverallBoundaries = false}) {
        if (svgBoundaries.length) {
            const svgContent = []
            const overallBoundaries = svgBoundaries.reduce((a, b) => mergeSvgBoundaries(a,b))
            svgContent.push(createClipPath({id:clipPathId, svgBoundaries}))
            if (renderSelections) {
                svgContent.push(createRect({
                    key: `${key}-selectedArea`,
                    boundaries: overallBoundaries,
                    color,
                    opacity: 0.3,
                    clipPath: `url(#${clipPathId})`,
                }))
            }
            if (renderLocalBoundaries) {
                svgContent.push(
                    ...svgBoundaries.map(b => createRect({
                        key: `${key}-LocalBoundaries-${b.minX}-${b.minY}-${b.maxX}-${b.maxY}`,
                        boundaries: b,
                        borderColor: 'lightgrey',
                        opacity:0
                    }))
                )
            }
            if ((focusedIdx??-1) >= 0) {
                const b = svgBoundaries[focusedIdx];
                svgContent.push(
                    createRect({
                        key: `${key}-focusedLocalBoundaries-${b.minX}-${b.minY}-${b.maxX}-${b.maxY}`,
                        boundaries: b,
                        borderColor: 'blue',
                        opacity:0
                    })
                )
            }
            if (renderOverallBoundaries) {
                const b = overallBoundaries
                svgContent.push(
                    createRect({
                        key: `${key}-overallBoundaries-${b.minX}-${b.minY}-${b.maxX}-${b.maxY}`,
                        boundaries: b,
                        borderColor: 'red',
                        opacity:0
                    })
                )
            }
            return {svgContent, overallBoundaries}
        } else {
            return {svgContent:[]}
        }
    }

    return {renderSelectedArea}
}