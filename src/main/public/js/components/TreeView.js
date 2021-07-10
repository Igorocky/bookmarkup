"use strict";

const COLLAPSED_SIGN = String.fromCharCode(8901)
const EXPANDED_SIGN = String.fromCharCode(8728)

function TreeView({tree, collapsedNodeRenderer, expandedNodeRenderer, showBullet, isExpanded, expandCollapse}) {

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

    function renderNode({node}) {
        const expanded = isExpanded(node.id)
        return RE.table({style:{borderCollapse: 'collapse'}},
            RE.tbody({},
                RE.tr({key:node.id, className:'tree-node', onClick: () => expandCollapse(node.id)},
                    RE.td({style: {width:'8px'}},
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

    return renderNode({node:tree})
}
