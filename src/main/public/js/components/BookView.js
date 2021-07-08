"use strict";

const PARAGRAPH_SYMBOL = String.fromCharCode(167)

const BookView = ({openView}) => {
    const {renderSelectedArea} = SelectedAreaRenderer()

    //state props
    const s = {
        BOOK: 'BOOK',
        VIEW_CURR_Y: 'VIEW_CURR_Y',
        VIEW_MAX_Y: 'VIEW_MAX_Y',
        VIEW_HEIGHT: 'VIEW_HEIGHT',
        PAGE_HEIGHT_PX: 'PAGE_HEIGHT_PX',
        SCROLL_SPEED: 'SCROLL_SPEED',
        SELECTIONS: 'SELECTIONS',
        FOCUSED_SELECTION_ID: 'FOCUSED_SELECTION_ID',
        EDIT_MODE: 'EDIT_MODE',
        EDITED_SELECTION_PROPS: 'EDITED_SELECTION_PROPS',
        MODAL_ACTIVE: 'MODAL_ACTIVE',
    }

    //scroll speed
    const ss = {
        SPEED_1: 'SPEED_1',
        SPEED_2: 'SPEED_2',
        SPEED_3: 'SPEED_3',
    }

    const query = useQuery()
    const bookId = query.get('bookId')

    const [state, setState] = useState(() => createState({}))
    const [ready, setReady] = useState(false)
    const [openConfirmActionDialog, closeConfirmActionDialog, renderConfirmActionDialog] = useConfirmActionDialog()
    const {
        getCursorType:getCursorTypeForImageSelector,
        renderControlButtons: renderControlButtonsOfImageSelector,
        renderSelectedArea:renderEditedSelectedArea,
        renderDots,
        clickHandler: imageSelectorClickHandler,
        renderDisplayModeSelector,
        state:imageSelectorState,
        stateAttrs: imageSelectorStateAttrs,
        displayModes: imageSelectorDisplayModes,
        renderSettings,
        setSelections: setSelectionsForImageSelector,
        saveSelections: saveSelectionsForImageSelector,
    } = useImageSelector({
        onCancel: () => setState(prev=>prev.set(s.EDIT_MODE,false)),
        onSave: newParts => {
            const newProps = {
                title: state[s.EDITED_SELECTION_PROPS].title,
                isMarkup: state[s.EDITED_SELECTION_PROPS].isMarkup,
            }
            const newSelections = sortBy(
                state[s.SELECTIONS].modifyAtIdx(
                    state.getIndexOfFocusedSelection(),
                    s => ({
                        ...s,
                        parts:newParts,
                        overallBoundaries: newParts.length?mergeSvgBoundaries(...newParts):null,
                        ...newProps
                    })
                ),
                e => (e.overallBoundaries?.minY) ?? -1
            )
            saveSelections({
                newSelections,
                onDone: () => setState(prev => prev
                    .set(s.SELECTIONS, newSelections)
                    .set(s.EDIT_MODE, false)
                )
            })
        }
    })

    useEffect(() => {
        Promise.all([
            be.getBook(bookId),
            be.getSelections(bookId)
        ]).then(loadBook)
    }, [])

    function loadBook([book, selections]) {
        let y = 0
        for (let page of book.pages) {
            page.y1 = y
            y += page.height
            page.y2 = y
        }
        book.maxY = y

        selections = selections.map(s => ({
            ...s,
            parts: s.parts.map(p => new SvgBoundaries(p)),
            overallBoundaries: s.overallBoundaries?new SvgBoundaries(s.overallBoundaries):undefined
        }))

        setState(prev => state
            .set(s.VIEW_MAX_Y, book.maxY-state[s.VIEW_HEIGHT])
            .set(s.BOOK, book)
            .set(s.SELECTIONS, selections)
        )
        setReady(true)
    }

    function createState({prevState, params}) {
        const getParam = createParamsGetter({prevState, params})

        return createObj({
            [s.BOOK]: getParam(s.BOOK, null),
            [s.VIEW_CURR_Y]: getParam(s.VIEW_CURR_Y, 0),
            [s.VIEW_HEIGHT]: getParam(s.VIEW_HEIGHT, 1300),
            [s.PAGE_HEIGHT_PX]: getParam(s.PAGE_HEIGHT_PX, 800),
            [s.SCROLL_SPEED]: getParam(s.SCROLL_SPEED, ss.SPEED_1),
            [s.FOCUSED_SELECTION_ID]: getParam(s.FOCUSED_SELECTION_ID, 1),
            [s.SELECTIONS]: getParam(s.SELECTIONS, null),
            getFocusedSelection() {
                return this[s.SELECTIONS][this.getIndexOfFocusedSelection()]
            },
            getIndexOfFocusedSelection() {
                const focusedId = this[s.FOCUSED_SELECTION_ID]
                const selections = this[s.SELECTIONS]
                for (let i = 0; i < selections.length; i++) {
                    if (selections[i].id == focusedId) {
                        return i
                    }
                }
            }
        })
    }

    function saveSelections({newSelections, onDone}) {
        setState(prev=>prev.set(s.MODAL_ACTIVE, true))
        be.saveSelections({bookId,selections:JSON.stringify(newSelections, null, 4)}).then(({status,msg}) => {
            if (status !== 'ok') {
                alert(`Error saving selections: ${msg}`)
            } else {
                setState(prev=>prev.set(s.MODAL_ACTIVE, false))
                onDone()
            }
        })
    }

    function createRect({boundaries, key, color, opacity, borderColor}) {
        return boundaries.toRect({
            key,
            props: {
                fill: color,
                fillOpacity: opacity,
                strokeWidth: borderColor ? 1 : 0,
                stroke: borderColor,
            }
        })
    }

    function createClipPath({id, boundaries}) {
        return re('clipPath', {key:`clip-path-${id}`, id},
            createRect({boundaries, key:`clip-path-rect-${id}`})
        )
    }

    function renderImage({imgPath, key, x, y, width, height, clipPath}) {
        return re('image', {
            key,
            x,
            y,
            width,
            height,
            href: imgPath,
            clipPath
        })
    }

    function rangesDontIntersect({r1:{y1:a,y2:b}, r2:{y1:c,y2:d}}) {
        return b <= c || d <= a
    }

    function rangesIntersect(args) {
        return !rangesDontIntersect(args)
    }

    function getPagesToRender({book,minY,maxY}) {
        return book.pages.filter(p => rangesIntersect({r1:{y1:p.y1,y2:p.y2}, r2:{y1:minY,y2:maxY}}))
    }

    function getPageImageUrl({page}) {
        return `/book/${bookId}/page/${page.fileName}`
    }

    function renderViewableContent({
                                       key = 'page',
                                       book = state[s.BOOK],
                                       selections = state[s.SELECTIONS],
                                       minY = state[s.VIEW_CURR_Y],
                                       maxY = minY + state[s.VIEW_HEIGHT],
                                       singleSelectionMode = false,
                                   }) {
        function getClipPathIdForSelection(selection) {
            return `${key}-selection-clipPath-${selection.id}`
        }

        function getColorForSelection(selection) {
            return state[s.FOCUSED_SELECTION_ID] === selection.id ? 'cyan' : selection.isMarkup ? 'magenta' : 'yellow'
        }

        const svgContent = []
        let boundaries = new SvgBoundaries({minX: 0, maxX: 0, minY, maxY})
        const pagesToRender = getPagesToRender({book, minY, maxY})

        for (let page of pagesToRender) {
            svgContent.push(renderImage({
                imgPath: getPageImageUrl({page}),
                key: `${key}-img-${page.y1}`,
                x: 0,
                y: page.y1,
                height: page.height,
                width: page.width,
                clipPath: singleSelectionMode?`url(#${getClipPathIdForSelection(selections[0])})`:undefined
            }))
            if (!singleSelectionMode) {
                svgContent.push(createRect({
                    key: `${key}-delimiter-${page.y1}`,
                    boundaries: new SvgBoundaries({minX: 0, maxX: page.width, minY: page.y2 - 1, maxY: page.y2 + 2}),
                    color: 'black'
                }))
            }
            boundaries = boundaries.addPoints(new Point(page.width, minY))
        }

        const selectionIdToHide = !singleSelectionMode && state[s.EDIT_MODE] ? state[s.FOCUSED_SELECTION_ID] : null
        const selectionsToRender = singleSelectionMode ? selections : selections
            .filter(s => hasValue(s.overallBoundaries))
            .filter(s => s.id != selectionIdToHide)
            .filter(s => rangesIntersect({
                r1: {y1: s.overallBoundaries.minY, y2: s.overallBoundaries.maxY},
                r2: {y1: minY, y2: maxY}
            }))
        for (let selection of selectionsToRender) {
            svgContent.push(renderSelectedArea({
                key: `${key}-selection-${selection.id}`,
                clipPathId: getClipPathIdForSelection(selection),
                color: getColorForSelection(selection),
                svgBoundaries: selection.parts,
                renderSelections: !singleSelectionMode
            }).svgContent)
        }

        if (!singleSelectionMode && state[s.EDIT_MODE]) {
            svgContent.push(
                renderEditedSelectedArea({
                    renderSelections: true,
                    clipPathId: 'clip-path-boundaries',
                    renderOverallBoundaries: true
                }).svgContent
            )
            svgContent.push(
                ...renderDots()
            )
        }

        return {
            svgContent,
            boundaries
        }
    }

    function scroll({dy}) {
        const viewMaxY = state[s.VIEW_MAX_Y]
        const viewCurrY = state[s.VIEW_CURR_Y]
        setState(state.set(s.VIEW_CURR_Y, Math.max(0, Math.min(viewMaxY, viewCurrY+dy))))
    }

    function renderControlButtons() {
        const viewHeight = state[s.VIEW_HEIGHT]

        function getScrollSpeedDy(scrollSpeedAlias) {
            return scrollSpeedAlias == ss.SPEED_1 ? viewHeight * 0.05
                : scrollSpeedAlias == ss.SPEED_2 ? viewHeight * 0.5
                    : viewHeight * 0.95
        }


        const scrollSpeed = getScrollSpeedDy(state[s.SCROLL_SPEED])


        function getSpeedButtonColor(speed) {
            return state[s.SCROLL_SPEED] === speed ? 'rgb(150,150,255)' : undefined
        }

        const buttons = [[
            {icon:RE.Icon({style:{transform: "rotate(90deg)"}}, "skip_previous"), onClick: () => setState(state.set(s.VIEW_CURR_Y, 0))},
            {iconName:"expand_less", style:{}, onClick: () => scroll({dy:-1*scrollSpeed})},
            {iconName:"expand_more", style:{}, onClick: () => scroll({dy:scrollSpeed})},
            {icon:RE.Icon({style:{transform: "rotate(-90deg)"}}, "skip_previous"), onClick: () => setState(state.set(s.VIEW_CURR_Y, state[s.VIEW_MAX_Y]))},
            {symbol:"1x", style:{backgroundColor:getSpeedButtonColor(ss.SPEED_1)}, onClick: () => setState(state.set(s.SCROLL_SPEED, ss.SPEED_1))},
            {symbol:"2x", style:{backgroundColor:getSpeedButtonColor(ss.SPEED_2)}, onClick: () => setState(state.set(s.SCROLL_SPEED, ss.SPEED_2))},
            {symbol:"3x", style:{backgroundColor:getSpeedButtonColor(ss.SPEED_3)}, onClick: () => setState(state.set(s.SCROLL_SPEED, ss.SPEED_3))},
        ]]

        return re(KeyPad, {
            componentKey: "book-controlButtons",
            keys: buttons,
            variant: "outlined",
            onKeyUp: ({keyCode,shiftKey}) => {
                if (keyCode === UP_ARROW_KEY_CODE) {
                    scroll({dy:-1*getScrollSpeedDy(ss.SPEED_1)})
                } else if (keyCode === DOWN_ARROW_KEY_CODE) {
                    scroll({dy:getScrollSpeedDy(ss.SPEED_1)})
                } else if (keyCode === PAGE_UP_KEY_CODE) {
                    scroll({dy:-1*getScrollSpeedDy(ss.SPEED_3)})
                } else if (keyCode === PAGE_DOWN_KEY_CODE) {
                    scroll({dy:getScrollSpeedDy(ss.SPEED_3)})
                } else if (keyCode === SPACE_KEY_CODE && shiftKey) {
                    scroll({dy:-1*getScrollSpeedDy(ss.SPEED_2)})
                } else if (keyCode === SPACE_KEY_CODE && !shiftKey) {
                    scroll({dy:getScrollSpeedDy(ss.SPEED_2)})
                }
            }
        })
    }

    function renderPagination() {
        const pages = state[s.BOOK].pages
        const currY = state[s.VIEW_CURR_Y]
        const midY = currY + state[s.VIEW_HEIGHT]/2
        return re(Pagination,{
            numOfPages: pages.length,
            curPage:pages.map((p,i)=>({p,i})).find(({p,i}) => p.y1 <= midY && midY <= p.y2).i+1,
            onChange: newPage => setState(state.set(s.VIEW_CURR_Y, pages[newPage-1].y1))
        })
    }

    function onWheel({nativeEvent}) {
        scroll({dy:nativeEvent.deltaY})
    }

    function deleteSelection() {
        openConfirmActionDialog({
            confirmText: `Delete '${state.getFocusedSelection().title}'?`,
            onCancel: closeConfirmActionDialog,
            startActionBtnText: "Delete",
            startAction: ({updateInProgressText,onDone}) => {
                const newSelections = state[s.SELECTIONS].removeAtIdx(state.getIndexOfFocusedSelection())
                saveSelections({
                    newSelections,
                    onDone: () => {
                        setState(prev => {
                            const newState = objectHolder(prev)
                            newState.set(s.SELECTIONS, newSelections)

                            const idx = prev.getIndexOfFocusedSelection()
                            if (idx >= newState.get(s.SELECTIONS).length) {
                                newState.set(s.FOCUSED_SELECTION_ID, newState.get(s.SELECTIONS).last()?.id)
                            } else {
                                newState.set(s.FOCUSED_SELECTION_ID, newState.get(s.SELECTIONS)[idx].id)
                            }
                            return newState.get()
                        })
                        closeConfirmActionDialog()
                    }
                })
            },
        })
    }

    function addNewSelection() {
        const newSelection = {
            id: (state[s.SELECTIONS].map(e => e.id).max()??0) + 1,
            title: 'New selection',
            parts: []
        }
        const newSelections = [
            newSelection,
            ...state[s.SELECTIONS]
        ]
        saveSelections({
            newSelections,
            onDone: () => setState(prev => prev
                .set(s.SELECTIONS, newSelections)
                .set(s.FOCUSED_SELECTION_ID, newSelection.id)
            )
        })
    }

    function editSelection() {
        const editedSelection = state.getFocusedSelection()
        const parts = editedSelection.parts
        setSelectionsForImageSelector({selections: parts})
        setState(prev=>prev
            .set(s.EDIT_MODE, true)
            .set(s.VIEW_CURR_Y, parts.length?parts.map(p=>p.minY).min():prev[s.VIEW_CURR_Y])
            .set(s.EDITED_SELECTION_PROPS, {title: editedSelection.title, isMarkup: editedSelection.isMarkup})
        )
    }

    function renderSelectionsList() {
        const buttons = [[
            {iconName:"add", style:{}, onClick: addNewSelection},
            {iconName:"settings", style:{}, disabled: !state[s.SELECTIONS].length, onClick: editSelection},
            {iconName:"delete_forever", style:{}, disabled: !state[s.SELECTIONS].length, onClick: deleteSelection},
        ]]

        return RE.Container.col.top.left({style:{padding: '5px'}},{style:{marginBottom:'2px'}},
            re(KeyPad, {
                componentKey: "book-selectionList-controlButtons",
                keys: buttons,
                variant: "outlined",
            }),
            state[s.SELECTIONS].map((selection,idx) => RE.Paper(
                {
                    key:`selection-${selection.id}-${selection.overallBoundaries?.minY??0}`,
                    style:{
                        backgroundColor:state[s.FOCUSED_SELECTION_ID] == selection.id ? 'cyan' : undefined,
                        padding:'5px',
                        cursor: 'pointer',
                    },
                    onClick: () => {
                        if (!state[s.EDIT_MODE]) {
                            setState(prev => prev
                                .set(s.FOCUSED_SELECTION_ID, selection.id)
                                .set(s.VIEW_CURR_Y, Math.min(prev[s.VIEW_MAX_Y], selection.overallBoundaries?.minY??prev[s.VIEW_CURR_Y]))
                            )
                        }
                    }
                },
                `${selection.isMarkup?PARAGRAPH_SYMBOL+' ':''}${(!selection.parts?.length)?'[empty] ':''}${selection.title}`
            ))
        )
    }

    function getCursorType() {
        if (!state[s.EDIT_MODE]) {
            return 'grab'
        } else {
            return getCursorTypeForImageSelector()
        }
    }

    function clickHandler(clickImageX, clickImageY, nativeEvent) {
        if (!state[s.EDIT_MODE]) {
            if (nativeEvent.type === 'mouseup') {
                const clickedPoint = new Point(clickImageX,clickImageY)
                const clickedSelection = state[s.SELECTIONS].find(sel => sel.parts?.some(p => p.includesPoint(clickedPoint)))
                if (clickedSelection) {
                    setState(prev => prev.set(s.FOCUSED_SELECTION_ID, clickedSelection.id))
                }
            }
        } else {
            imageSelectorClickHandler(clickImageX, clickImageY, nativeEvent)
        }
    }

    function updateEditedSelectionProps({prop,value}) {
        setState(prev => prev.set(
            s.EDITED_SELECTION_PROPS,
            {...prev[s.EDITED_SELECTION_PROPS], [prop]:value}
        ))
    }

    function renderSelectionPropsControls() {
        return RE.Container.row.left.center({},{},
            RE.TextField(
                {
                    variant: 'outlined', label: 'Title',
                    style: {width: '800px'},
                    autoFocus: true,
                    onChange: event => {
                        const newTitle = event.nativeEvent.target.value
                        updateEditedSelectionProps({prop:'title',value:newTitle})
                    },
                    onKeyUp: event => event.nativeEvent.keyCode == 13 ? saveSelectionsForImageSelector() : null,
                    value: state[s.EDITED_SELECTION_PROPS].title
                }
            ),
            RE.FormControlLabel({
                control: RE.Checkbox({
                    checked: state[s.EDITED_SELECTION_PROPS].isMarkup?true:false,
                    onChange: (event,newValue) => updateEditedSelectionProps({prop: 'isMarkup', value: newValue})
                }),
                label:'markup'
            })
        )
    }

    function renderSingleSelection({selection}) {
        const selectionBoundaries = selection.overallBoundaries
        if (!selectionBoundaries) {
            return
        }
        const {svgContent} = renderViewableContent({
            key:'singleSelection',
            singleSelectionMode: true,
            selections: [selection],
            book: state[s.BOOK],
            minY: selectionBoundaries.minY,
            maxY: selectionBoundaries.maxY,
        })

        const scaleFactor = state[s.PAGE_HEIGHT_PX]/state[s.VIEW_HEIGHT]
        const height = selectionBoundaries.height()*scaleFactor
        const width = selectionBoundaries.width()*scaleFactor
        return RE.svg(
            {
                width,
                height,
                boundaries: selectionBoundaries,
            },
            ...svgContent,
        )
    }

    function renderPages() {
        const {svgContent:viewableContentSvgContent, boundaries:viewableContentBoundaries} = renderViewableContent({})

        const height = state[s.PAGE_HEIGHT_PX]
        const width = height * (viewableContentBoundaries.width()/viewableContentBoundaries.height())
        return RE.Container.col.top.left({},{},
            renderPagination(),
            state[s.EDIT_MODE] ? RE.Container.col.top.left({}, {},
                renderSelectionPropsControls(),
                renderControlButtonsOfImageSelector()
            ) : null,
            RE.svg(
                {
                    width,
                    height,
                    boundaries: viewableContentBoundaries,
                    onClick: clickHandler,
                    onWheel,
                    props: {
                        style: {cursor: getCursorType()}
                    }
                },
                ...viewableContentSvgContent,
                createRect({
                    boundaries:viewableContentBoundaries,
                    opacity:0,
                    borderColor:'black',
                    key: 'book-view-boarder'
                })
            ),
            renderControlButtons(),
        )
    }

    function createTree({selections}) {
        function getLevel(selection) {
            if (selection.isMarkup) {
                const split1 = selection.title?.split(' ')
                if (split1 && split1.length) {
                    return split1[0].split('.').length
                } else {
                    return 1
                }
            }
        }
        let roots = [{children:[]}]
        for (let selection of selections) {
            const level = Math.min(roots.length, getLevel(selection))
            if (hasNoValue(level)) {
                roots.last().children.push({node:selection,children:[]})
            } else {
                const newNode = {node:selection,children:[]}
                roots[level-1].children.push(newNode)
                roots = roots.slice(0,level)
                roots.push(newNode)
            }
        }
        return roots[0].children
    }

    function renderTree() {
        function mapToTreeItems(nodes) {
            return nodes.map(n => RE.TreeItem(
                {nodeId:n.id,label:n.title},
                mapToTreeItems(n.children)
            ))
        }
        const tree = createTree({selections:state[s.SELECTIONS]})
        return RE.TreeView({defaultCollapseIcon:'-',defaultExpandIcon:'+'},
            mapToTreeItems(tree)
        )
    }

    // if (state[s.SELECTIONS]) {
    //     const tree = createTree({selections:state[s.SELECTIONS]})
    //     console.log('tree', tree)
    // }

    if (!ready) {
        return "Loading..."
    } else {
        return RE.Container.col.top.left({},{},
            RE.table({},
                RE.tbody({},
                    RE.tr({},
                        RE.td({valign:'top'},
                            renderPages(),
                        ),
                        RE.td({valign:'top'},
                            renderSelectionsList(),
                        )
                    ),
                )
            ),
            renderConfirmActionDialog(),
        )
    }
}