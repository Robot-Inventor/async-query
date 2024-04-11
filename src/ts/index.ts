/**
 * Note: AsyncQuerySelector type and AsyncQuerySelectorAll type are based on TypeScript's lib.dom.d.ts.
 *
 * Only the type definitions for overloading the querySelector() function and querySelectorAll() function in
 * that code were extracted and rewritten so that they could be written in the object and
 * added parentElement and timeoutMs arguments.
 *
 * The following license comment is noted to comply with
 * the TypeScript license and is not the async-query's license.
 */

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

type AsyncQuerySelector = {
    <K extends keyof HTMLElementTagNameMap>(
        selectors: K,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<HTMLElementTagNameMap[K] | null>;

    <K extends keyof SVGElementTagNameMap>(
        selectors: K,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<SVGElementTagNameMap[K] | null>;

    <K extends keyof MathMLElementTagNameMap>(
        selectors: K,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<MathMLElementTagNameMap[K] | null>;

    /** @deprecated */
    <K extends keyof HTMLElementDeprecatedTagNameMap>(
        selectors: K,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<HTMLElementDeprecatedTagNameMap[K] | null>;

    <E extends Element = Element>(
        selectors: string,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<E | null>;
};

type AsyncQuerySelectorAll = {
    <K extends keyof HTMLElementTagNameMap>(
        selectors: K,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<NodeListOf<HTMLElementTagNameMap[K]>>;

    <K extends keyof SVGElementTagNameMap>(
        selectors: K,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<NodeListOf<SVGElementTagNameMap[K]>>;

    <K extends keyof MathMLElementTagNameMap>(
        selectors: K,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<NodeListOf<MathMLElementTagNameMap[K]>>;

    /** @deprecated */
    <K extends keyof HTMLElementDeprecatedTagNameMap>(
        selectors: K,
        parentElement?: Element | Document,
        timeoutMs?: number
    ): Promise<NodeListOf<HTMLElementDeprecatedTagNameMap[K]>>;

    <E extends Element = Element>(selectors: string, parentElement?: Element | Document, timeoutMs?: number): Promise<
        NodeListOf<E>
    >;
};

/*!
 * The following code is provided under the MIT License.
 */

const asyncQuerySelectorBase = <E extends typeof document.querySelector | typeof document.querySelectorAll>(
    selectorFunction: () => ReturnType<E>,
    timeoutMs: number
): Promise<ReturnType<E> | null> => {
    const promise = new Promise<ReturnType<E> | null>((resolve) => {
        const initialResult = selectorFunction();
        if (
            (initialResult instanceof Element && initialResult) ||
            (initialResult instanceof NodeList && initialResult.length)
        ) {
            resolve(initialResult);
            return;
        }

        let timeout: number | null = null;

        const observer = new MutationObserver(() => {
            const element = selectorFunction();
            if (!element) return;

            observer.disconnect();
            if (timeout) {
                clearTimeout(timeout);
            }
            resolve(element);
        });

        timeout = setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeoutMs);

        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true
        });
    });

    return promise;
};

/**
 * Returns the first element that is a descendant of node that matches selectors.
 * @param selectors selector
 * @param parentElement parent element
 * @param timeoutMs timeout in milliseconds
 * @returns result
 */
const asyncQuerySelector: AsyncQuerySelector = async (
    selectors: string,
    parentElement: Element | Document = document,
    timeoutMs: number = 500
): Promise<ReturnType<typeof document.querySelector>> => {
    const result = await asyncQuerySelectorBase<typeof document.querySelector>(
        () => parentElement.querySelector(selectors),
        timeoutMs
    );
    return result;
};

/**
 * Returns all element descendants of node that match selectors.
 * @param selectors selector
 * @param parentElement parent element
 * @param timeoutMs timeout in milliseconds
 * @returns result
 */
const asyncQuerySelectorAll: AsyncQuerySelectorAll = async (
    selectors: string,
    parentElement: Element | Document = document,
    timeoutMs: number = 500
): Promise<ReturnType<typeof document.querySelectorAll>> => {
    const result =
        (await asyncQuerySelectorBase<typeof document.querySelectorAll>(
            () => parentElement.querySelectorAll(selectors),
            timeoutMs
        )) ?? (document.createDocumentFragment().childNodes as NodeListOf<Element>);

    return result;
};

export { asyncQuerySelector, asyncQuerySelectorAll };
