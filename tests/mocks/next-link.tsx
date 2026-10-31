import React from 'react'
export default function Link(props: any) {
  return React.createElement('a', { href: props.href, className: props.className, onClick: props.onClick }, props.children)
}
