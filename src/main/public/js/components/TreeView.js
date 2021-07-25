"use strict";

const COLLAPSED_SIGN = String.fromCharCode(8226)
const EXPANDED_SIGN = String.fromCharCode(9711)

function TreeView({tree, collapsedNodeRenderer, expandedNodeRenderer, showBullet, isExpanded, expandCollapse, focusedNodeId, setFocusedNodeId,
                      onDownArrowPressed, onUpArrowPressed, onRightArrowPressed, onLeftArrowPressed, onRightArrowCtrlPressed}) {

    const tableRef = useRef(null)

    useEffect(() => {
        tableRef.current.addEventListener('keyup', onKeyUp)
        return () => tableRef.current?tableRef.current.removeEventListener('keyup', onKeyUp):null
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

    function onKeyUp(event) {
        const {keyCode, ctrlKey} = event
        if (ctrlKey) {
            if (keyCode === RIGHT_ARROW_KEY_CODE) {
                onRightArrowCtrlPressed?.()
            }
        } else {
            if (keyCode === DOWN_ARROW_KEY_CODE) {
                onDownArrowPressed?.()
            } else if (keyCode === UP_ARROW_KEY_CODE) {
                onUpArrowPressed?.()
            } else if (keyCode === RIGHT_ARROW_KEY_CODE) {
                onRightArrowPressed?.()
            } else if (keyCode === LEFT_ARROW_KEY_CODE) {
                onLeftArrowPressed?.()
            }
        }
    }

    return renderNode({node:tree, tabIndex:0})
}
