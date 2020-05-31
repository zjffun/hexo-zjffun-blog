// [Rich Harris / stacking-order · GitLab](https://gitlab.com/Rich-Harris/stacking-order)
export default function getZIndex ( node ) {
	return node && Number( getComputedStyle( node ).zIndex ) || 0;
}
