// Option loading for the select types.
//
// A definition's options are either an array or an async loader. Loaders are called the
// first time an editor needs them and the result is cached per loader function, so
// reopening an editor doesn't refetch and chips can show labels once they're known.

"use client";

import { useEffect, useState } from "react";

import type { FilterDefinition, FilterOption } from "./types";

type OptionsLoader = () => Promise<FilterOption[]>;

const cache = new WeakMap<OptionsLoader, FilterOption[]>();
const inFlight = new WeakMap<OptionsLoader, Promise<FilterOption[]>>();

/** Options that are available right now, without loading. Undefined while not loaded yet. */
export function getLoadedOptions(definition: FilterDefinition): FilterOption[] | undefined {
  const { options } = definition;
  if (options === undefined) return [];
  if (Array.isArray(options)) return options;
  return cache.get(options);
}

function loadOptions(loader: OptionsLoader): Promise<FilterOption[]> {
  let promise = inFlight.get(loader);
  if (!promise) {
    promise = loader().then((result) => {
      cache.set(loader, result);
      return result;
    });
    inFlight.set(loader, promise);
    // Allow a retry after a failure.
    promise.catch(() => inFlight.delete(loader));
  }
  return promise;
}

/** Returns the definition's options, loading them if needed. `undefined` while loading. */
export function useFilterOptions(definition: FilterDefinition): FilterOption[] | undefined {
  const { options } = definition;
  const [loaded, setLoaded] = useState<{ loader: OptionsLoader; options: FilterOption[] }>();

  useEffect(() => {
    if (typeof options !== "function" || cache.has(options)) return;
    let cancelled = false;
    loadOptions(options).then(
      (result) => {
        if (!cancelled) setLoaded({ loader: options, options: result });
      },
      () => {
        // Leave the editor in its loading state; the loader can log its own errors.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [options]);

  if (typeof options === "function" && loaded?.loader === options) return loaded.options;
  return getLoadedOptions(definition);
}

/** The label for a value, falling back to the raw value when it isn't a known option. */
export function getOptionLabel(definition: FilterDefinition, value: string): string {
  return getLoadedOptions(definition)?.find((o) => o.value === value)?.label ?? value;
}
