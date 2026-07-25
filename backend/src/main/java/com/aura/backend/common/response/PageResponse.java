package com.aura.backend.common.response;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Plain, stable pagination envelope so we never leak Spring's PageImpl serialization on the wire. */
public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
