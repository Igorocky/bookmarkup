"use strict";

const COLLAPSED_SIGN = String.fromCharCode(8226)
const EXPANDED_SIGN = String.fromCharCode(9711)

function TreeView({tree, collapsedNodeRenderer, expandedNodeRenderer, showBullet, isExpanded, expandCollapse, focusedNodeId, setFocusedNodeId,
                      onDownArrowPressed, onUpArrowPressed, onRightArrowPressed, onLeftArrowPressed, onRightArrowCtrlPressed,
                      onPageDownPressed, onPageUpPressed, onPageDownShiftPressed, onPageUpShiftPressed}) {

    const tableRef = useRef(null)

    useEffect(() => {
        tableRef.current.addEventListener('keyup', onKey)
        tableRef.current.addEventListener('keydown', onKey)
        return () => {
            tableRef.current?tableRef.current.removeEventListener('keyup', onKey):null
            tableRef.current?tableRef.current.removeEventListener('keydown', onKey):null
        }
    }, [onDownArrowPressed, onUpArrowPressed, onRightArrowPressed, onLeftArrowPressed, onRightArrowCtrlPressed])

    function renderExpandedNodeContent({node}) {
        const expandedContent = expandedNodeRenderer(node);
        return RE.Fragment({},
            expandedContent?RE.tr({key:node.id+'-exp'},
                RE.td({},
                    '',
                ),
                RE.td({},
                    expandedContent,
                )
            ):null,
            (node.children??[]).map(child =>
                RE.tr({key:child.id},
                    RE.td({},
                        '',
                    ),
                    RE.td({},
                        renderNode({node:child}),
                    )
                )
            )
        )
    }

    function renderNode({node, tabIndex}) {
        const expanded = isExpanded(node.id)
        return RE.table({tabIndex, ref:hasValue(tabIndex)?tableRef:undefined,style:{borderCollapse: 'collapse'}},
            RE.tbody({},
                RE.tr(
                    {
                        key:node.id,
                        className:'tree-node',
                        style:{backgroundColor:focusedNodeId === node.id ? 'yellow' : undefined},
                        onClick: () => {
                            setFocusedNodeId(node.id)
                            expandCollapse(node.id)
                        }
                    },
                    RE.td({style: {width:'10px',height:'25px',fontSize:expanded?'8px':'20px',fontWeight:'bold'}},
                        showBullet(node)?(expanded?EXPANDED_SIGN:COLLAPSED_SIGN):'',
                    ),
                    RE.td({},
                        collapsedNodeRenderer(node),
                    )
                ),
                expanded?renderExpandedNodeContent({node}):null
            )
        )
    }

    function onKey(event) {
        function runHandler({event,handler}) {
            if (handler) {
                event.preventDefault()
                if (event.type === 'keyup') {
                    handler()
                }
            }
        }
        const {keyCode, ctrlKey, shiftKey} = event
        if (ctrlKey) {
            if (keyCode === RIGHT_ARROW_KEY_CODE) {
                runHandler({event, handler:onRightArrowCtrlPressed})
            }
        } else if (shiftKey) {
            if (keyCode === PAGE_UP_KEY_CODE) {
                runHandler({event, handler:onPageUpShiftPressed})
            } else if (keyCode === PAGE_DOWN_KEY_CODE) {
                runHandler({event, handler:onPageDownShiftPressed})
            }
        } else {
            if (keyCode === DOWN_ARROW_KEY_CODE) {
                runHandler({event, handler:onDownArrowPressed})
            } else if (keyCode === UP_ARROW_KEY_CODE) {
                runHandler({event, handler:onUpArrowPressed})
            } else if (keyCode === RIGHT_ARROW_KEY_CODE) {
                runHandler({event, handler:onRightArrowPressed})
            } else if (keyCode === LEFT_ARROW_KEY_CODE) {
                runHandler({event, handler:onLeftArrowPressed})
            } else if (keyCode === PAGE_UP_KEY_CODE) {
                runHandler({event, handler:onPageUpPressed})
            } else if (keyCode === PAGE_DOWN_KEY_CODE) {
                runHandler({event, handler:onPageDownPressed})
            }
        }
    }

    return renderNode({node:tree, tabIndex:0})
}
