"use strict";

function useImageSelector({onCancel, onSave}) {
    const {renderSelectedArea} = SelectedAreaRenderer()

    //state props
    const s = {
        SELECTED_POINT: 'SELECTED_POINT',
        SELECTED_BOUNDARIES: 'SELECTED_BOUNDARIES',
        DISPLAY_MODE: 'DISPLAY_MODE',
        SELECTED_RECT_IDX: 'SELECTED_RECT_IDX',
        EDIT_MODE: 'EDIT_MODE',
        MOVE_SPEED: 'MOVE_SPEED',
        SHOW_LOCAL_BOUNDARIES: 'SHOW_LOCAL_BOUNDARIES',
    }

    //display mode
    const dm = {
        EDIT_SELECTION: 'EDIT_SELECTION',
        CLIPPED_INFO: 'CLIPPED_INFO',
    }

    //edit mode
    const em = {
        ADD_SELECTION: 'ADD_SELECTION',
        MOVE: 'MOVE',
        RESIZE_LEFT: 'RESIZE_LEFT',
        RESIZE_RIGHT: 'RESIZE_RIGHT',
        RESIZE_TOP: 'RESIZE_TOP',
        RESIZE_BOTTOM: 'RESIZE_BOTTOM',
    }

    //move speed
    const ms = {
        SPEED_1: 'SPEED_1',
        SPEED_2: 'SPEED_2',
        SPEED_3: 'SPEED_3',
    }

    const [state, setState] = useState(() => createState({}))

    function createState({prevState, params}) {
        const getParam = createParamsGetter({prevState, params})

        return createObj({
            [s.SELECTED_POINT]: null,
            [s.SELECTED_BOUNDARIES]: [],
            [s.DISPLAY_MODE]: dm.EDIT_SELECTION,
            [s.SELECTED_RECT_IDX]: 0,
            [s.EDIT_MODE]: em.ADD_SELECTION,
            [s.MOVE_SPEED]: ms.SPEED_1,
            [s.SHOW_LOCAL_BOUNDARIES]: false,
        })
    }

    function renderDots() {
        const point = state[s.SELECTED_POINT]
        if (hasNoValue(point)) {
            return []
        } else {
            return [
                svgCircle({key:`point`, c: new Point(point.x, point.y), r:3, props:{fill:'orange'}})
            ]
        }
    }

    function processClick({clickedPoint}) {
        if (state[s.DISPLAY_MODE] === dm.EDIT_SELECTION) {
            if (state[s.EDIT_MODE] === em.ADD_SELECTION) {
                if (hasNoValue(state[s.SELECTED_POINT])) {
                    setState(state.set(s.SELECTED_POINT, clickedPoint));
                } else {
                    const firstPoint = state[s.SELECTED_POINT]
                    setState(
                        state
                            .set(s.SELECTED_POINT, null)
                            .set(
                                s.SELECTED_BOUNDARIES,
                                [
                                    ...state[s.SELECTED_BOUNDARIES],
                                    SvgBoundaries.fromPoints(firstPoint, clickedPoint)
                                ]
                            )
                    )
                }
            } else {
                const found = state[s.SELECTED_BOUNDARIES]
                    .map((b,i) => ({boundaries:b,idx:i}))
                    .find(({boundaries,idx}) => boundaries.includesPoint(clickedPoint))
                if (hasValue(found)) {
                    setState(state.set(
                        s.SELECTED_RECT_IDX,
                        found.idx
                    ))
                }
            }
        }
    }

    function getCursorType() {
        if (state[s.DISPLAY_MODE] === dm.CLIPPED_INFO) {
            return 'auto'
        } else {
            return state[s.EDIT_MODE] === em.ADD_SELECTION ? 'crosshair' : 'pointer'
        }
    }

    function renderSettings() {
        return RE.FormGroup({row:true},
            RE.FormControlLabel({
                control: RE.Checkbox({
                    checked: state[s.SHOW_LOCAL_BOUNDARIES],
                    onChange: (event,newValue) => {
                        setState(prev => prev.set(s.SHOW_LOCAL_BOUNDARIES, newValue))
                    }
                }),
                label:s.SHOW_LOCAL_BOUNDARIES
            })
        )
    }

    function renderDisplayModeSelector() {
        return RE.RadioGroup({
                row: true,
                value: state[s.DISPLAY_MODE],
                onChange: (event,newValue) => {
                    setState(prev => prev.set(s.DISPLAY_MODE, newValue))
                }
            },
            RE.FormControlLabel({label: dm.EDIT_SELECTION, value: dm.EDIT_SELECTION,
                control: RE.Radio({})}),
            RE.FormControlLabel({label: dm.CLIPPED_INFO, value: dm.CLIPPED_INFO,
                control: RE.Radio({})}),
        )
    }

    function renderControlButtons() {
        const moveSpeed = state[s.MOVE_SPEED] == ms.SPEED_1 ? 1 : state[s.MOVE_SPEED] == ms.SPEED_2 ? 5 : 20
        const dirLeft = SVG_EX.rotate(180)
        const dirRight = SVG_EX
        const dirUp = SVG_EX.rotate(90)
        const dirDown = SVG_EX.rotate(-90)

        function move({dir}) {
            setState(state.set(s.SELECTED_BOUNDARIES, state[s.SELECTED_BOUNDARIES].modifyAtIdx(state[s.SELECTED_RECT_IDX], b => b.translate(dir,moveSpeed))))
        }

        function createSvgBoundaries(minX, maxX, minY, maxY) {
            return new SvgBoundaries({minX, maxX, minY, maxY})
        }

        function resize({dir}) {
            function resizeInner({dir,boundaries}) {
                if (state[s.EDIT_MODE] == em.RESIZE_LEFT) {
                    return createSvgBoundaries(boundaries.minX + dir.end.x, boundaries.maxX, boundaries.minY, boundaries.maxY)
                } else if (state[s.EDIT_MODE] == em.RESIZE_RIGHT) {
                    return createSvgBoundaries(boundaries.minX, boundaries.maxX + dir.end.x, boundaries.minY, boundaries.maxY)
                } else if (state[s.EDIT_MODE] == em.RESIZE_TOP) {
                    return createSvgBoundaries(boundaries.minX, boundaries.maxX, boundaries.minY + dir.end.y, boundaries.maxY)
                } else if (state[s.EDIT_MODE] == em.RESIZE_BOTTOM) {
                    return createSvgBoundaries(boundaries.minX, boundaries.maxX, boundaries.minY, boundaries.maxY + dir.end.y)
                }
            }

            setState(state.set(
                s.SELECTED_BOUNDARIES,
                state[s.SELECTED_BOUNDARIES].modifyAtIdx(state[s.SELECTED_RECT_IDX], b => resizeInner({dir,boundaries:b}))
            ))
        }

        function dirBtnClicked({dir}) {
            if (state[s.EDIT_MODE] == em.MOVE) {
                move({dir})
            } else {
                resize({dir:dir.scale(moveSpeed)})
            }
        }

        function isDirBtnActive({dir}) {
            if (state[s.EDIT_MODE] == em.RESIZE_BOTTOM || state[s.EDIT_MODE] == em.RESIZE_TOP) {
                return Math.abs(dir.end.x) < 0.1
            } else if (state[s.EDIT_MODE] == em.RESIZE_LEFT || state[s.EDIT_MODE] == em.RESIZE_RIGHT) {
                return Math.abs(dir.end.y) < 0.1
            } else {
                return true
            }
        }

        function getEditButtonColor(editMode) {
            return state[s.EDIT_MODE] === editMode ? 'rgb(150,150,255)' : undefined
        }

        function getSpeedButtonColor(speed) {
            if (state[s.EDIT_MODE] === em.ADD_SELECTION) {
                return undefined
            } else {
                return state[s.MOVE_SPEED] === speed ? 'rgb(150,150,255)' : undefined
            }
        }

        function remove() {
            setState(
                state
                    .set(
                        s.SELECTED_BOUNDARIES,
                        state[s.SELECTED_BOUNDARIES].removeAtIdx(state[s.SELECTED_RECT_IDX])
                    )
                    .set(
                        s.SELECTED_RECT_IDX,
                        Math.max(0,state[s.SELECTED_RECT_IDX]-1)
                    )
            )
        }

        const buttons = [[
            {iconName:"add", style:{backgroundColor:getEditButtonColor(em.ADD_SELECTION)}, onClick: () => setState(state.set(s.EDIT_MODE, em.ADD_SELECTION))},
            {iconName:"control_camera", style:{backgroundColor:getEditButtonColor(em.MOVE)}, onClick: () => setState(state.set(s.EDIT_MODE, em.MOVE))},
            {iconName:"skip_previous", style:{backgroundColor:getEditButtonColor(em.RESIZE_LEFT)}, onClick: () => setState(state.set(s.EDIT_MODE, em.RESIZE_LEFT))},
            {icon:RE.Icon({style:{transform: "rotate(90deg)"}}, "skip_previous"), style:{backgroundColor:getEditButtonColor(em.RESIZE_TOP)}, onClick: () => setState(state.set(s.EDIT_MODE, em.RESIZE_TOP))},
            {icon:RE.Icon({style:{transform: "rotate(-90deg)"}}, "skip_previous"), style:{backgroundColor:getEditButtonColor(em.RESIZE_BOTTOM)}, onClick: () => setState(state.set(s.EDIT_MODE, em.RESIZE_BOTTOM))},
            {iconName:"skip_next", style:{backgroundColor:getEditButtonColor(em.RESIZE_RIGHT)}, onClick: () => setState(state.set(s.EDIT_MODE, em.RESIZE_RIGHT))},
            {iconName:"chevron_left", onClick: () => dirBtnClicked({dir:dirLeft}), disabled: !isDirBtnActive({dir:dirLeft})},
            {iconName:"expand_less", onClick: () => dirBtnClicked({dir:dirUp}), disabled: !isDirBtnActive({dir:dirUp})},
            {iconName:"expand_more", onClick: () => dirBtnClicked({dir:dirDown}), disabled: !isDirBtnActive({dir:dirDown})},
            {iconName:"chevron_right", onClick: () => dirBtnClicked({dir:dirRight}), disabled: !isDirBtnActive({dir:dirRight})},
            {symbol:"1x", style:{backgroundColor:getSpeedButtonColor(ms.SPEED_1)}, onClick: () => setState(state.set(s.MOVE_SPEED, ms.SPEED_1))},
            {symbol:"2x", style:{backgroundColor:getSpeedButtonColor(ms.SPEED_2)}, onClick: () => setState(state.set(s.MOVE_SPEED, ms.SPEED_2))},
            {symbol:"3x", style:{backgroundColor:getSpeedButtonColor(ms.SPEED_3)}, onClick: () => setState(state.set(s.MOVE_SPEED, ms.SPEED_3))},
            {iconName:"delete_forever", style:{color:'red'}, onClick: remove},
            {iconName:"cancel", onClick: () => onCancel?.()},
            {iconName:"save", style:{color:'blue'}, onClick: () => onSave?.(state[s.SELECTED_BOUNDARIES])},
        ]]

        return re(KeyPad, {
            componentKey: "controlButtons",
            keys: buttons,
            variant: "outlined",
        })
    }

    return {
        renderControlButtons,
        renderDisplayModeSelector,
        renderSelectedArea: ({renderSelections, clipPathId, renderOverallBoundaries}) => renderSelectedArea({
            key: 'selectedArea',
            svgBoundaries: state[s.SELECTED_BOUNDARIES],
            focusedIdx: state[s.EDIT_MODE] !== em.ADD_SELECTION ? state[s.SELECTED_RECT_IDX] : -1,
            color: 'cyan',
            clipPathId: clipPathId,
            renderSelections,
            renderOverallBoundaries,
            renderLocalBoundaries: state[s.SHOW_LOCAL_BOUNDARIES]
        }),
        clickHandler: (clickImageX, clickImageY, nativeEvent) => {
            if (nativeEvent.type === 'mouseup') {
                processClick({clickedPoint: new Point(clickImageX,clickImageY)})
            }
        },
        getCursorType,
        renderDots,
        state,
        stateAttrs: s,
        displayModes: dm,
        renderSettings,
        setSelections({selections}) {
            setState(prev=>prev
                .set(s.SELECTED_BOUNDARIES, selections)
                .set(s.SELECTED_POINT, null)
                .set(s.EDIT_MODE, em.ADD_SELECTION)
            )
        }
    }
}

const ImageSelector = () => {
    const {
        getCursorType,
        renderControlButtons,
        renderSelectedArea,
        renderDots,
        clickHandler,
        renderDisplayModeSelector,
        state,
        stateAttrs: s,
        displayModes: dm,
        renderSettings,
    } = useImageSelector({})

    function renderImage({imgPath, clipPath, id}) {
        return re('image', {
            key: `bgrd-img-${id}`,
            x: 0,
            y: 0,
            width: imgWidth,
            height: imgHeight,
            href: imgPath,
            clipPath
        })
    }

    const imgPath = 'img/p1.png'
    const imgWidth = 1122
    const imgHeight = 767

    const isClippedDisplayMode = state[s.DISPLAY_MODE] === dm.CLIPPED_INFO
    const CLIP_PATH_ID = 'clip-path-boundaries'

    const {svgContent: selectedAreaSvgContent, overallBoundaries: selectedAreaOverallBoundaries} = renderSelectedArea({
        renderSelections: !isClippedDisplayMode,
        clipPathId: CLIP_PATH_ID
    })

    const svgBoundaries = !isClippedDisplayMode
        ? new SvgBoundaries({minX:0, maxX:imgWidth, minY:0, maxY:imgHeight})
        : selectedAreaOverallBoundaries?.addAbsoluteMargin(5)??new SvgBoundaries({minX:0, maxX:imgWidth, minY:0, maxY:imgHeight})

    return RE.Container.col.top.center({},{},
        renderDisplayModeSelector(),
        RE.svg(
            {
                width: svgBoundaries.width(),
                height: svgBoundaries.height(),
                boundaries: svgBoundaries,
                onClick: clickHandler,
                props: {
                    style: {cursor: getCursorType()}
                }
            },
            renderImage({imgPath, clipPath: isClippedDisplayMode ? `url(#${CLIP_PATH_ID})` : undefined}),
            ...renderDots(),
            ...selectedAreaSvgContent,
        ),
        state[s.DISPLAY_MODE] == dm.EDIT_SELECTION ? RE.Fragment({},
            renderSettings(),
            renderControlButtons()
        ) : null
    )

}